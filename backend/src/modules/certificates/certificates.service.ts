import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { IssueCertificateDto } from './dto/issue-certificate.dto';
import { RevokeCertificateDto } from './dto/revoke-certificate.dto';
import { CertificatePdfService } from './certificate-pdf.service';

@Injectable()
export class CertificatesService {
  constructor(
    private prisma: PrismaService,
    private readonly certificatePdf: CertificatePdfService,
  ) {}

  // ── Gerar código sequencial CERT0001 ──
  private async generateCode(): Promise<string> {
    const last = await this.prisma.certificate.findFirst({
      where: { code: { startsWith: 'CERT' } },
      orderBy: { code: 'desc' },
      select: { code: true },
    });
    const match = last?.code.match(/^CERT(\d{4})$/);
    const num = match ? parseInt(match[1], 10) + 1 : 1;
    return `CERT${String(num).padStart(4, '0')}`;
  }

  // ── Gerar número único SMCORP-ANO-SEQUENCIAL ──
  private async generateCertificateNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `SMCORP-${year}-`;
    const last = await this.prisma.certificate.findFirst({
      where: { certificateNumber: { startsWith: prefix } },
      orderBy: { certificateNumber: 'desc' },
      select: { certificateNumber: true },
    });
    const match = last?.certificateNumber.match(/(\d{5})$/);
    const num = match ? parseInt(match[1], 10) + 1 : 1;
    return `${prefix}${String(num).padStart(5, '0')}`;
  }

  // ── Listar certificados ──
  async findAll(filters?: {
    status?: string;
    courseId?: string;
    studentId?: string;
    search?: string;
  }) {
    const where: any = { deletedAt: null };

    if (filters?.status) where.status = filters.status;
    if (filters?.courseId) where.courseId = filters.courseId;
    if (filters?.studentId) where.studentId = filters.studentId;
    if (filters?.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { certificateNumber: { contains: filters.search, mode: 'insensitive' } },
        { student: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.certificate.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, cpf: true, code: true } },
        course: { select: { id: true, name: true, code: true, validityMonths: true } },
        enrollment: { select: { id: true, status: true } },
        issuedBy: { select: { id: true, name: true } },
        template: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Detalhe ──
  async findOne(id: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { id },
      include: {
        student: {
          select: { id: true, name: true, cpf: true, code: true, email: true, phone: true },
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            validityMonths: true,
            durationHours: true,
            certificationInfo: true,
          },
        },
        enrollment: { select: { id: true, status: true, enrolledAt: true, confirmedAt: true } },
        issuedBy: { select: { id: true, name: true } },
        template: true,
      },
    });
    if (!cert || cert.deletedAt) {
      throw new NotFoundException(`Certificado ${id} não encontrado`);
    }
    return cert;
  }

  // ── Criar rascunho ──
  async create(data: CreateCertificateDto) {
    return this.prisma.$transaction(async (prisma) => {
      // Verificar se já existe certificado para esta matrícula
      const existing = await prisma.certificate.findUnique({
        where: { enrollmentId: data.enrollmentId },
      });
      if (existing) {
        throw new ConflictException('Já existe um certificado para esta matrícula');
      }

      // Verificar se a matrícula existe
      const enrollment = await prisma.enrollment.findUnique({
        where: { id: data.enrollmentId },
        include: { class: { include: { course: true } } },
      });
      if (!enrollment) {
        throw new NotFoundException('Matrícula não encontrada');
      }

      const code = await this.generateCode();
      const certificateNumber = await this.generateCertificateNumber();
      const validityMonths = data.validityMonths || enrollment.class.course.validityMonths;

      return prisma.certificate.create({
        data: {
          code,
          certificateNumber,
          enrollmentId: data.enrollmentId,
          studentId: data.studentId,
          courseId: data.courseId,
          templateId: data.templateId,
          validityMonths,
          metadata: (data.metadata || {}) as Prisma.InputJsonValue,
          status: 'DRAFT',
        },
        include: {
          student: { select: { id: true, name: true, code: true } },
          course: { select: { id: true, name: true, code: true } },
        },
      });
    });
  }

  // ── Atualizar rascunho ──
  async update(id: string, data: UpdateCertificateDto) {
    const cert = await this.findOne(id);
    if (cert.status !== 'DRAFT') {
      throw new BadRequestException('Apenas certificados em rascunho podem ser editados');
    }
    const { enrollmentId, studentId, courseId, templateId, metadata, ...updateData } = data;
    return this.prisma.certificate.update({
      where: { id },
      data: {
        ...updateData,
        ...(templateId !== undefined && { template: { connect: { id: templateId } } }),
        ...(metadata && { metadata: metadata as Prisma.InputJsonValue }),
      },
    });
  }

  // ── Emitir certificado ──
  async issue(id: string, data: IssueCertificateDto) {
    const cert = await this.findOne(id);
    if (cert.status !== 'DRAFT') {
      throw new BadRequestException('Apenas certificados em rascunho podem ser emitidos');
    }

    // Verificar pré-requisitos
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: cert.enrollmentId },
      include: {
        exams: { where: { deletedAt: null } },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Matrícula não encontrada');
    }

    // Enrollment deve estar PRESENT ou CONFIRMED
    if (!['PRESENT', 'CONFIRMED'].includes(enrollment.status)) {
      throw new BadRequestException(
        `Status da matrícula inválido: ${enrollment.status}. Requer PRESENT ou CONFIRMED.`,
      );
    }

    // Documentos devem estar COMPLETE
    if (enrollment.documentsStatus !== 'COMPLETE') {
      throw new BadRequestException(
        `Documentos pendentes: status atual "${enrollment.documentsStatus}". Todos devem estar COMPLETE.`,
      );
    }

    // Exames devem estar aprovados (se existirem)
    const failedExams = enrollment.exams.filter(
      (e) => e.status === 'FAILED' || (e.status === 'COMPLETED' && !e.passed),
    );
    if (failedExams.length > 0) {
      throw new BadRequestException(
        `Existem ${failedExams.length} prova(s) reprovada(s). Todas devem estar aprovadas.`,
      );
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + cert.validityMonths);

    return this.prisma.certificate.update({
      where: { id },
      data: {
        status: 'ISSUED',
        issuedAt: now,
        expiresAt,
        issuedById: data.issuedById,
        templateId: data.templateId || cert.templateId,
        metadata: data.metadata ? { ...(cert.metadata as any), ...data.metadata } : cert.metadata,
      },
      include: {
        student: { select: { id: true, name: true, code: true } },
        course: { select: { id: true, name: true, code: true } },
        issuedBy: { select: { id: true, name: true } },
      },
    });
  }

  // ── Revogar certificado ──
  async revoke(id: string, data: RevokeCertificateDto) {
    const cert = await this.findOne(id);
    if (cert.status !== 'ISSUED') {
      throw new BadRequestException('Apenas certificados emitidos podem ser revogados');
    }

    return this.prisma.certificate.update({
      where: { id },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        revokedReason: data.reason,
      },
    });
  }

  // ── Verificar autenticidade por número ──
  async verifyByNumber(number: string) {
    // Rota pública (QR/link no certificado impresso) — não há tenant no
    // contexto, então não dá pra usar a chave composta (tenantId, number).
    // certificateNumber agora é único só POR TENANT (antes era global) —
    // dois tenants distintos podem coincidentemente ter emitido o mesmo
    // número. findFirst + orderBy mantém a busca determinística nesse caso
    // raro, mas não pode redirecionar cross-tenant por engano.
    const cert = await this.prisma.certificate.findFirst({
      where: { certificateNumber: number },
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { name: true, cpf: true } },
        course: { select: { name: true, code: true, durationHours: true } },
      },
    });
    if (!cert || cert.deletedAt) {
      return { valid: false, message: 'Certificado não encontrado' };
    }
    if (cert.status === 'REVOKED') {
      return { valid: false, message: 'Certificado foi revogado', revokedAt: cert.revokedAt };
    }
    if (cert.status === 'EXPIRED' || (cert.expiresAt && cert.expiresAt < new Date())) {
      return { valid: false, message: 'Certificado expirado', expiresAt: cert.expiresAt };
    }

    return {
      valid: true,
      certificate: {
        number: cert.certificateNumber,
        code: cert.code,
        studentName: cert.student.name,
        courseName: cert.course.name,
        courseCode: cert.course.code,
        durationHours: cert.course.durationHours,
        issuedAt: cert.issuedAt,
        expiresAt: cert.expiresAt,
        status: cert.status,
      },
    };
  }

  // ── Baixar PDF ──
  async download(id: string): Promise<Buffer> {
    const cert = await this.findOne(id);

    if (cert.status === 'DRAFT') {
      throw new BadRequestException(
        'Certificado em rascunho não pode ser baixado. Emita-o primeiro.',
      );
    }

    const appUrl = process.env.APP_URL || 'https://smcorp.com.br';
    const verifyUrl = `${appUrl.replace(/\/$/, '')}/verificar-certificado?numero=${encodeURIComponent(cert.certificateNumber)}`;

    return this.certificatePdf.generate(
      {
        certificateNumber: cert.certificateNumber,
        issuedAt: cert.issuedAt,
        expiresAt: cert.expiresAt,
        validityMonths: cert.validityMonths,
        metadata: (cert.metadata as Record<string, unknown>) || null,
        student: cert.student ? { name: cert.student.name, cpf: cert.student.cpf } : null,
        course: cert.course
          ? {
              name: cert.course.name,
              code: cert.course.code,
              durationHours: cert.course.durationHours,
            }
          : null,
        issuedBy: cert.issuedBy ? { name: cert.issuedBy.name } : null,
      },
      verifyUrl,
    );
  }

  // ── Soft delete ──
  async softDelete(id: string) {
    const cert = await this.findOne(id);
    return this.prisma.certificate.update({
      where: { id: cert.id },
      data: { deletedAt: new Date() },
    });
  }

  // ── Restaurar ──
  async restore(id: string) {
    return this.prisma.certificate.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  // ── Estatísticas ──
  async getStats() {
    const [total, issued, draft, expired, revoked, expiringIn30Days] = await Promise.all([
      this.prisma.certificate.count({ where: { deletedAt: null } }),
      this.prisma.certificate.count({ where: { deletedAt: null, status: 'ISSUED' } }),
      this.prisma.certificate.count({ where: { deletedAt: null, status: 'DRAFT' } }),
      this.prisma.certificate.count({ where: { deletedAt: null, status: 'EXPIRED' } }),
      this.prisma.certificate.count({ where: { deletedAt: null, status: 'REVOKED' } }),
      this.prisma.certificate.count({
        where: {
          deletedAt: null,
          status: 'ISSUED',
          expiresAt: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return { total, issued, draft, expired, revoked, expiringIn30Days };
  }
}
