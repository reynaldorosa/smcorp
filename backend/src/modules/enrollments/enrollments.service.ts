import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/services/tenant-context.service';
import { Prisma, ExamStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import {
  CreateEnrollmentDto,
  EnrollmentExtraProductItemDto,
  AddEnrollmentExtraProductsDto,
  GenerateEnrollmentTokenDto,
  ValidateEnrollmentTokenDto,
  RequestDiscountDto,
  ApproveDiscountDto,
  UpdateEnrollmentStatusDto,
} from './dto/enrollment.dto';

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private async getValidEnrollmentByToken(tokenInput: string) {
    const token = (tokenInput || '').trim();

    if (!token) {
      throw new BadRequestException('Token é obrigatório');
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { enrollmentToken: token },
      select: {
        id: true,
        studentId: true,
        tenantId: true,
        tokenExpiresAt: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Token inválido');
    }

    if (enrollment.tokenExpiresAt && enrollment.tokenExpiresAt < new Date()) {
      throw new BadRequestException('Token expirado');
    }

    return enrollment;
  }

  private async ensureEnrollment(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { id: true },
    });

    if (!enrollment) {
      throw new NotFoundException('Matrícula não encontrada');
    }

    return enrollment;
  }

  private async getExtraProductsMap(extraProductIds: string[]) {
    const uniqueIds = Array.from(new Set(extraProductIds));
    const extraProducts = await this.prisma.extraProduct.findMany({
      where: {
        id: { in: uniqueIds },
        deletedAt: null,
        isActive: true,
      },
      select: { id: true, price: true },
    });

    if (extraProducts.length !== uniqueIds.length) {
      const existingIds = new Set(extraProducts.map((product) => product.id));
      const missingIds = uniqueIds.filter((id) => !existingIds.has(id));
      throw new NotFoundException(`Produtos extras não encontrados: ${missingIds.join(', ')}`);
    }

    return new Map(extraProducts.map((product) => [product.id, product]));
  }

  private buildEnrollmentExtraProductRow(
    enrollmentId: string,
    item: EnrollmentExtraProductItemDto,
    price: number,
  ) {
    const quantity = item.quantity ?? 1;
    const unitPrice = item.unitPrice ?? price;
    return {
      enrollmentId,
      extraProductId: item.extraProductId,
      quantity,
      unitPrice,
      totalPrice: unitPrice * quantity,
      notes: item.notes,
    };
  }

  private async syncEnrollmentExtraProducts(
    enrollmentId: string,
    items: EnrollmentExtraProductItemDto[],
  ) {
    if (!items.length) {
      return [];
    }

    const productMap = await this.getExtraProductsMap(items.map((item) => item.extraProductId));

    const operations = items.map((item) => {
      const product = productMap.get(item.extraProductId);
      if (!product) {
        throw new NotFoundException('Produto extra não encontrado');
      }
      const data = this.buildEnrollmentExtraProductRow(enrollmentId, item, Number(product.price));

      return this.prisma.enrollmentExtraProduct.upsert({
        where: {
          enrollmentId_extraProductId: {
            enrollmentId,
            extraProductId: item.extraProductId,
          },
        },
        create: data,
        update: data,
      });
    });

    return this.prisma.$transaction(operations);
  }

  private async getEnrollmentExtraProductsSummary(enrollmentId: string) {
    const items = await this.prisma.enrollmentExtraProduct.findMany({
      where: { enrollmentId, deletedAt: null },
      include: {
        extraProduct: {
          select: {
            id: true,
            name: true,
            associatedCostIds: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      extraProductIds: items.map((item) => item.extraProductId),
      extraProducts: items,
    };
  }

  async uploadPublicDocumentByToken(data: { token: string; documentType: string; file: any }) {
    const documentType = (data.documentType || '').trim();

    if (!documentType) {
      throw new BadRequestException('Tipo de documento é obrigatório');
    }

    if (!data.file) {
      throw new BadRequestException('Arquivo é obrigatório');
    }

    const enrollment = await this.getValidEnrollmentByToken(data.token);

    const file = data.file;
    const mimeType = file.mimetype || 'application/octet-stream';
    const fileName = file.originalname || null;
    const fileSize = typeof file.size === 'number' ? file.size : null;

    if (!file.buffer) {
      throw new BadRequestException('Arquivo inválido');
    }

    const fileUrl = `data:${mimeType};base64,${file.buffer.toString('base64')}`;

    // Fluxo público: vincula o documento ao tenant resolvido pelo token
    return this.tenantContext.run({ tenantId: enrollment.tenantId || undefined }, () =>
      this.prisma.studentDocument.create({
        data: {
          studentId: enrollment.studentId,
          documentType,
          fileUrl,
          fileName,
          fileSize,
          mimeType,
          status: 'PENDING',
        },
      }),
    );
  }

  async deletePublicDocumentByToken(data: { token: string; documentId: string }) {
    const enrollment = await this.getValidEnrollmentByToken(data.token);
    const documentId = (data.documentId || '').trim();

    if (!documentId) {
      throw new BadRequestException('Documento inválido');
    }

    // Fluxo público: opera dentro do tenant resolvido pelo token
    return this.tenantContext.run({ tenantId: enrollment.tenantId || undefined }, async () => {
      const document = await this.prisma.studentDocument.findFirst({
        where: {
          id: documentId,
          studentId: enrollment.studentId,
          deletedAt: null,
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (!document) {
        throw new NotFoundException('Documento não encontrado para este link');
      }

      if (document.status === 'COMPLETE') {
        throw new BadRequestException('Documento aprovado não pode ser removido');
      }

      await this.prisma.studentDocument.update({
        where: { id: document.id },
        data: { deletedAt: new Date() },
      });

      return {
        success: true,
        message: 'Documento removido com sucesso',
        documentId: document.id,
      };
    });
  }

  private async validateEnrollmentEntities(data: CreateEnrollmentDto) {
    const student = await this.prisma.student.findUnique({
      where: { id: data.studentId },
      select: { id: true, deletedAt: true, companyId: true },
    });

    if (!student || student.deletedAt) {
      throw new NotFoundException('Aluno não encontrado');
    }

    const classRecord = await this.prisma.class.findUnique({
      where: { id: data.classId },
      select: { id: true, deletedAt: true, companyId: true },
    });

    if (!classRecord || classRecord.deletedAt) {
      throw new NotFoundException('Turma não encontrada');
    }

    return { student, classRecord };
  }

  async createEnrollment(data: CreateEnrollmentDto, companyScopeId?: string) {
    const existing = await this.prisma.enrollment.findUnique({
      where: {
        studentId_classId: {
          studentId: data.studentId,
          classId: data.classId,
        },
      },
      select: { id: true, deletedAt: true },
    });

    if (existing && !existing.deletedAt) {
      throw new ConflictException('Aluno já matriculado nesta turma');
    }

    const { student, classRecord } = await this.validateEnrollmentEntities(data);

    if (companyScopeId) {
      if (!student.companyId || student.companyId !== companyScopeId) {
        throw new ForbiddenException('Acesso negado para matricular aluno de outra empresa');
      }

      if (classRecord.companyId && classRecord.companyId !== companyScopeId) {
        throw new ForbiddenException('Acesso negado para matricular em turma de outra empresa');
      }
    }

    const enrollment = await this.prisma.enrollment.create({
      data: {
        studentId: data.studentId,
        classId: data.classId,
        status: data.status ?? 'SCHEDULED',
        notes: data.observations,
      },
      include: {
        student: true,
        class: { include: { course: true } },
      },
    });

    if (data.extraProducts && data.extraProducts.length > 0) {
      await this.syncEnrollmentExtraProducts(enrollment.id, data.extraProducts);
    }

    const extraProducts = await this.getEnrollmentExtraProductsSummary(enrollment.id);

    return {
      ...enrollment,
      ...extraProducts,
    };
  }

  async addExtraProducts(data: AddEnrollmentExtraProductsDto) {
    await this.ensureEnrollment(data.enrollmentId);
    await this.syncEnrollmentExtraProducts(data.enrollmentId, data.items);
    return this.getEnrollmentExtraProductsSummary(data.enrollmentId);
  }

  async getExtraProducts(enrollmentId: string) {
    await this.ensureEnrollment(enrollmentId);
    return this.getEnrollmentExtraProductsSummary(enrollmentId);
  }

  async removeExtraProduct(enrollmentId: string, extraProductId: string) {
    await this.ensureEnrollment(enrollmentId);

    const existing = await this.prisma.enrollmentExtraProduct.findUnique({
      where: {
        enrollmentId_extraProductId: { enrollmentId, extraProductId },
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Produto extra não vinculado');
    }

    await this.prisma.enrollmentExtraProduct.update({
      where: { enrollmentId_extraProductId: { enrollmentId, extraProductId } },
      data: { deletedAt: new Date() },
    });

    return this.getEnrollmentExtraProductsSummary(enrollmentId);
  }

  /**
   * Gera token único de matrícula com expiração
   * @param data - Dados para geração do token
   * @returns Enrollment com token gerado
   */
  async generateEnrollmentToken(data: GenerateEnrollmentTokenDto) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: data.enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundException('Matrícula não encontrada');
    }

    // Gerar token criptograficamente seguro (64 caracteres hex)
    const token = randomBytes(32).toString('hex');

    // Calcular data de expiração
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + data.expiresInHours);

    return await this.prisma.enrollment.update({
      where: { id: data.enrollmentId },
      data: {
        enrollmentToken: token,
        tokenExpiresAt: expiresAt,
        tokenUsedAt: null,
      },
      include: {
        student: {
          select: {
            name: true,
            email: true,
          },
        },
        class: {
          select: {
            code: true,
            course: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Valida token de matrícula e marca como usado
   * @param data - Token a ser validado
   * @returns Enrollment se token válido
   */
  async validateToken(data: ValidateEnrollmentTokenDto) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { enrollmentToken: data.token },
      include: {
        student: {
          include: {
            documents: {
              where: { deletedAt: null },
              orderBy: { uploadedAt: 'desc' },
            },
          },
        },
        class: {
          include: {
            course: {
              select: {
                name: true,
                code: true,
                price: true,
                requiredDocuments: true,
              },
            },
            room: {
              select: {
                id: true,
                name: true,
                address: true,
                location: true,
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
            dueDate: true,
            paidAt: true,
            paymentMethod: true,
          },
        },
        exams: {
          where: { deletedAt: null },
          orderBy: { scheduledDate: 'desc' },
          select: {
            id: true,
            examCode: true,
            examNumber: true,
            scheduledDate: true,
            scheduledTime: true,
            status: true,
            score: true,
            passed: true,
            notes: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Token inválido');
    }

    if (enrollment.tokenExpiresAt && enrollment.tokenExpiresAt < new Date()) {
      throw new BadRequestException('Token expirado');
    }

    // Reutilizável: apenas valida e retorna os dados.
    return enrollment;
  }

  /**
   * Solicita desconto para uma matrícula
   * Aguarda aprovação de usuário MASTER
   * @param data - Dados do desconto
   */
  async requestDiscount(data: RequestDiscountDto) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: data.enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundException('Matrícula não encontrada');
    }

    if (enrollment.discountApprovedBy) {
      throw new BadRequestException(
        'Matrícula já possui desconto aprovado. Revogue o desconto anterior primeiro.',
      );
    }

    return await this.prisma.enrollment.update({
      where: { id: data.enrollmentId },
      data: {
        discount: data.discount,
        // Desconto fica pendente de aprovação
        discountApprovedBy: null,
        discountApprovedAt: null,
      },
    });
  }

  /**
   * Aprova desconto solicitado
   * Apenas usuários com role MASTER podem aprovar
   * @param data - Dados de aprovação
   */
  async approveDiscount(data: ApproveDiscountDto) {
    // Verificar se o aprovador é MASTER
    const master = await this.prisma.user.findUnique({
      where: { id: data.masterId },
    });

    if (!master || master.role !== 'MASTER') {
      throw new ForbiddenException('Apenas usuários MASTER podem aprovar descontos');
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: data.enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundException('Matrícula não encontrada');
    }

    if (!enrollment.discount || enrollment.discount.toNumber() === 0) {
      throw new BadRequestException('Não há desconto solicitado para aprovar');
    }

    if (enrollment.discountApprovedBy) {
      throw new BadRequestException('Desconto já foi aprovado anteriormente');
    }

    return await this.prisma.enrollment.update({
      where: { id: data.enrollmentId },
      data: {
        discountApprovedBy: data.masterId,
        discountApprovedAt: new Date(),
      },
      include: {
        approvedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Revoga aprovação de desconto
   * @param enrollmentId - ID da matrícula
   * @param masterId - ID do usuário MASTER revogando
   */
  async revokeDiscount(enrollmentId: string, masterId: string) {
    const master = await this.prisma.user.findUnique({
      where: { id: masterId },
    });

    if (!master || master.role !== 'MASTER') {
      throw new ForbiddenException('Apenas usuários MASTER podem revogar descontos');
    }

    return await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        discount: 0,
        discountApprovedBy: null,
        discountApprovedAt: null,
      },
    });
  }

  /**
   * Atualiza status da matrícula
   * SCHEDULED → TO_CONFIRM → CONFIRMED → PRESENT
   * @param data - Novos dados de status
   */
  async updateStatus(data: UpdateEnrollmentStatusDto) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: data.enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundException('Matrícula não encontrada');
    }

    const updateData: Prisma.EnrollmentUpdateInput = {
      status: data.status,
    };

    // Marcar datas automáticas baseado no status
    if (data.status === 'CONFIRMED' && !enrollment.confirmedAt) {
      updateData.confirmedAt = new Date();
    }

    if (data.status === 'PRESENT' && !enrollment.attendedAt) {
      updateData.attendedAt = new Date();
    }

    return await this.prisma.enrollment.update({
      where: { id: data.enrollmentId },
      data: updateData,
    });
  }

  /**
   * Busca detalhes completos de uma matrícula
   * @param enrollmentId - ID da matrícula
   */
  async findOne(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            photoUrl: true,
            cpf: true,
          },
        },
        class: {
          include: {
            course: {
              select: {
                name: true,
                code: true,
                requiredDocuments: true,
              },
            },
            room: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
        payment: true,
        extraProducts: {
          include: {
            extraProduct: true,
          },
        },
        exams: {
          include: {
            instructor: {
              select: {
                name: true,
              },
            },
          },
        },
        approvedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Matrícula não encontrada');
    }

    return {
      ...enrollment,
      extraProductIds: enrollment.extraProducts.map((item) => item.extraProductId),
    };
  }

  /**
   * Lista todas as matrículas de uma turma com status resumido
   * Usado no dashboard operacional
   * @param classId - ID da turma
   */
  async findByClass(classId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        classId,
        deletedAt: null,
      },
      include: {
        student: {
          select: {
            name: true,
            photoUrl: true,
          },
        },
        payment: {
          select: {
            status: true,
          },
        },
        exams: {
          select: {
            status: true,
          },
        },
      },
      orderBy: {
        student: {
          name: 'asc',
        },
      },
    });

    // Transformar em formato de card
    return enrollments.map((enrollment) => ({
      enrollmentId: enrollment.id,
      studentName: enrollment.student.name,
      photoUrl: enrollment.student.photoUrl,
      enrollmentStatus: enrollment.status,
      buttons: {
        PAG: enrollment.payment?.status === 'PAID' ? 'green' : 'red',
        DOC: enrollment.documentsStatus === 'COMPLETE' ? 'green' : 'red',
        PROVA: this.getExamButtonColor(enrollment.exams),
      },
      discount: enrollment.discount?.toNumber() || 0,
      discountApproved: !!enrollment.discountApprovedBy,
    }));
  }

  /**
   * Calcula cor do botão de prova baseado nos status dos exames
   * @param exams - Lista de exames do aluno
   * @returns Cor do botão: gray, blue, green, red
   */
  private getExamButtonColor(exams: Array<{ status: ExamStatus }>): string {
    if (!exams || exams.length === 0) return 'gray';

    const hasApproved = exams.some((e) => e.status === 'APPROVED');
    const hasFailed = exams.some((e) => e.status === 'FAILED');
    const hasInProgress = exams.some((e) => e.status === 'IN_PROGRESS');

    if (hasApproved) return 'green';
    if (hasFailed) return 'red';
    if (hasInProgress) return 'blue';

    return 'gray'; // SCHEDULED
  }
}
