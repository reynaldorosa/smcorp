import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateStudentDto, UpdateStudentDto } from './dto/student.dto';
import { TenantContextService } from '../../common/services/tenant-context.service';
import { TenantRlsService } from '../../common/services/tenant-rls.service';

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly tenantRls: TenantRlsService,
  ) {}

  /**
   * MASTER/plataforma (sem tenantId no contexto): comportamento atual sem
   * RLS. Usuários de tenant (ADMIN/COLLABORATOR/CLIENT_PJ): executa dentro
   * de uma transação com RLS armado (role smcorp_rls + app.tenant_id) como
   * segunda camada de isolamento além do middleware Prisma.
   */
  private async runTenantScoped<T>(
    fn: (client: Prisma.TransactionClient | PrismaService) => Promise<T>,
  ): Promise<T> {
    const { tenantId } = this.tenantContext.get();
    if (!tenantId) return fn(this.prisma);
    return this.tenantRls.withTenantRls(fn);
  }

  /**
   * Gera código sequencial automático para aluno (A0001, A0002, etc.)
   */
  private async generateStudentCode(): Promise<string> {
    const lastStudent = await this.runTenantScoped((client) =>
      client.student.findFirst({
        where: { deletedAt: null },
        orderBy: { code: 'desc' },
        select: { code: true },
      }),
    );

    if (!lastStudent) {
      return 'A0001';
    }

    // Extrai número do código e incrementa. Parse defensivo: se algum código
    // legado não seguir o padrão "A####", não gera "ANaN" — recomeça a série.
    const digits = (lastStudent.code || '').replace(/\D/g, '');
    const lastNumber = /^\d+$/.test(digits) ? parseInt(digits, 10) : 0;
    const nextNumber = lastNumber + 1;

    // Formata com zeros à esquerda (ex: A0001, A0002, ..., A9999)
    return 'A' + nextNumber.toString().padStart(4, '0');
  }

  /**
   * Cria novo aluno com código automático
   */
  async create(data: CreateStudentDto, companyScopeId?: string) {
    if (companyScopeId && data.companyId && data.companyId !== companyScopeId) {
      throw new ForbiddenException('Acesso negado para criar aluno em outra empresa');
    }

    const effectiveCompanyId = companyScopeId || data.companyId;

    // Verificar se CPF já existe (único por tenant — a mesma pessoa pode
    // ser aluna em centros de treinamento diferentes)
    const existingStudent = await this.runTenantScoped((client) =>
      client.student.findFirst({
        where: { cpf: data.taxId },
      }),
    );

    if (existingStudent) {
      throw new ConflictException('CPF já cadastrado no sistema');
    }

    // Gerar código automático se não fornecido
    const code = data.code || (await this.generateStudentCode());

    return await this.runTenantScoped((client) =>
      client.student.create({
        data: {
          code,
          name: data.name,
          cpf: data.taxId,
          rg: data.rg,
          email: data.email,
          phone: data.phone,
          birthDate: data.birthDate,
          companyId: effectiveCompanyId,
          photoUrl: data.photoUrl,
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    );
  }

  /**
   * Lista todos os alunos com paginação
   */
  async findAll(page = 1, limit = 20, search?: string) {
    // Clamp defensivo: page/limit negativos ou absurdos não podem gerar
    // skip negativo (erro do Prisma) nem paginação gigante.
    const safePage = Math.max(1, Math.trunc(page));
    const safeLimit = Math.min(100, Math.max(1, Math.trunc(limit)));
    const skip = (safePage - 1) * safeLimit;

    const where: Prisma.StudentWhereInput = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // findMany + count no MESMO client (uma transação só quando RLS ativo —
    // os dois lados veem o mesmo estado)
    const [students, total] = await this.runTenantScoped(async (client) => {
      const [items, count] = await Promise.all([
        client.student.findMany({
          where,
          skip,
          take: safeLimit,
          orderBy: { code: 'asc' },
          include: {
            company: {
              select: {
                id: true,
                name: true,
              },
            },
            enrollments: {
              where: { deletedAt: null },
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                classId: true,
                documentsStatus: true,
                status: true,
                notes: true,
              },
            },
          },
        }),
        client.student.count({ where }),
      ]);
      return [items, count] as const;
    });

    return {
      data: students,
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  /**
   * Busca aluno por ID
   */
  async findOne(id: string) {
    const student = await this.runTenantScoped((client) =>
      client.student.findUnique({
        where: { id },
        include: {
          company: true,
          enrollments: {
            include: {
              class: {
                include: {
                  course: true,
                },
              },
            },
          },
        },
      }),
    );

    if (!student) {
      throw new NotFoundException('Aluno não encontrado');
    }

    return student;
  }

  /**
   * Busca aluno por código
   */
  async findByCode(code: string) {
    const student = await this.runTenantScoped((client) =>
      client.student.findFirst({
        where: { code },
        include: {
          company: true,
          enrollments: true,
        },
      }),
    );

    if (!student) {
      throw new NotFoundException('Aluno não encontrado');
    }

    return student;
  }

  /**
   * Atualiza aluno
   */
  async update(id: string, data: UpdateStudentDto) {
    const student = await this.runTenantScoped((client) =>
      client.student.findUnique({
        where: { id },
      }),
    );

    if (!student) {
      throw new NotFoundException('Aluno não encontrado');
    }

    // Verificar conflito de CPF se alterado
    if (data.taxId && data.taxId !== student.cpf) {
      const existingStudent = await this.runTenantScoped((client) =>
        client.student.findFirst({
          where: { cpf: data.taxId },
        }),
      );

      if (existingStudent) {
        throw new ConflictException('CPF já cadastrado para outro aluno');
      }
    }

    const { taxId, ...rest } = data;
    const updateData: Prisma.StudentUpdateInput = {
      ...rest,
      ...(taxId ? { cpf: taxId } : {}),
    };

    return await this.runTenantScoped((client) =>
      client.student.update({
        where: { id },
        data: updateData,
        include: {
          company: true,
        },
      }),
    );
  }

  /**
   * Remove aluno (soft delete)
   */
  async remove(id: string) {
    const student = await this.runTenantScoped((client) =>
      client.student.findUnique({
        where: { id },
      }),
    );

    if (!student) {
      throw new NotFoundException('Aluno não encontrado');
    }

    return await this.runTenantScoped((client) =>
      client.student.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          isActive: false,
        },
      }),
    );
  }
}
