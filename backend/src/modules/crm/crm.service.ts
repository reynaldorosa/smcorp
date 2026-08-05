import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContactDto, UpdateContactDto } from './dto/contact.dto';
import { CreateActivityDto, UpdateActivityDto } from './dto/activity.dto';
import { CreateDealDto, UpdateDealDto, MoveDealDto, LostDealDto } from './dto/deal.dto';
import {
  CreatePipelineStageDto,
  UpdatePipelineStageDto,
  ReorderPipelineDto,
} from './dto/pipeline.dto';

@Injectable()
export class CrmService {
  constructor(private prisma: PrismaService) {}

  private isMissingCrmTableError(error: unknown): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
      return false;
    }

    if (error.code !== 'P2021') {
      return false;
    }

    const table = (error.meta as { table?: string } | undefined)?.table;
    return !table || table.includes('crm_');
  }

  private async safeCrmRead<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (this.isMissingCrmTableError(error)) {
        return fallback;
      }
      throw error;
    }
  }

  // ════════════════════════════════════════
  // CONTATOS
  // ════════════════════════════════════════

  private async generateContactCode(): Promise<string> {
    const last = await this.prisma.cRMContact.findFirst({
      where: { code: { startsWith: 'C' } },
      orderBy: { code: 'desc' },
      select: { code: true },
    });
    const match = last?.code.match(/^C(\d{4})$/);
    const num = match ? parseInt(match[1], 10) + 1 : 1;
    return `C${String(num).padStart(4, '0')}`;
  }

  async findAllContacts(filters?: {
    status?: string;
    source?: string;
    assignedToId?: string;
    search?: string;
    tag?: string;
  }) {
    const where: any = { deletedAt: null };
    if (filters?.status) where.status = filters.status;
    if (filters?.source) where.source = filters.source;
    if (filters?.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters?.tag) where.tags = { has: filters.tag };
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.safeCrmRead(
      () =>
        this.prisma.cRMContact.findMany({
          where,
          include: {
            assignedTo: { select: { id: true, name: true } },
            _count: { select: { activities: true, deals: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
      [],
    );
  }

  async findOneContact(id: string) {
    const contact = await this.prisma.cRMContact.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true } },
        student: { select: { id: true, name: true, code: true } },
        companyRef: { select: { id: true, name: true } },
        activities: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { createdBy: { select: { id: true, name: true } } },
        },
        deals: {
          where: { deletedAt: null },
          include: { stage: { select: { id: true, name: true, color: true } } },
        },
      },
    });
    if (!contact || contact.deletedAt) {
      throw new NotFoundException(`Contato ${id} não encontrado`);
    }
    return contact;
  }

  async createContact(data: CreateContactDto) {
    const code = await this.generateContactCode();
    return this.prisma.cRMContact.create({
      data: {
        code,
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        cpfCnpj: data.cpfCnpj,
        source: data.source || 'MANUAL',
        status: data.status || 'LEAD',
        assignedToId: data.assignedToId,
        studentId: data.studentId,
        companyId: data.companyId,
        tags: data.tags || [],
        notes: data.notes,
        customFields: (data.customFields || {}) as Prisma.InputJsonValue,
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
    });
  }

  async updateContact(id: string, data: UpdateContactDto) {
    await this.findOneContact(id);
    const { companyId, studentId, assignedToId, customFields, ...rest } = data;
    return this.prisma.cRMContact.update({
      where: { id },
      data: {
        ...rest,
        lastContactAt: new Date(),
        ...(companyId !== undefined && { company_rel: { connect: { id: companyId } } }),
        ...(studentId !== undefined && { student: { connect: { id: studentId } } }),
        ...(assignedToId !== undefined && { assignedTo: { connect: { id: assignedToId } } }),
        ...(customFields && { customFields: customFields as Prisma.InputJsonValue }),
      },
    });
  }

  async deleteContact(id: string) {
    await this.findOneContact(id);
    return this.prisma.cRMContact.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async convertToStudent(id: string) {
    const contact = await this.findOneContact(id);
    if (contact.studentId) {
      throw new ConflictException('Contato já vinculado a um aluno');
    }

    // Gerar código de aluno
    const lastStudent = await this.prisma.student.findFirst({
      where: { deletedAt: null },
      orderBy: { code: 'desc' },
      select: { code: true },
    });
    const studentNum = lastStudent ? parseInt(lastStudent.code.substring(1), 10) + 1 : 1;
    const studentCode = `A${String(studentNum).padStart(4, '0')}`;

    return this.prisma.$transaction(async (prisma) => {
      const student = await prisma.student.create({
        data: {
          code: studentCode,
          name: contact.name,
          cpf: contact.cpfCnpj || `TEMP-${Date.now()}`,
          email: contact.email,
          phone: contact.phone,
          companyId: contact.companyId,
        },
      });

      await prisma.cRMContact.update({
        where: { id },
        data: {
          studentId: student.id,
          status: 'ENROLLED',
          lastContactAt: new Date(),
        },
      });

      return student;
    });
  }

  async getContactStats() {
    return this.safeCrmRead(
      async () => {
        const [total, lead, qualified, interested, negotiation, enrolled, lost] = await Promise.all(
          [
            this.prisma.cRMContact.count({ where: { deletedAt: null } }),
            this.prisma.cRMContact.count({ where: { deletedAt: null, status: 'LEAD' } }),
            this.prisma.cRMContact.count({ where: { deletedAt: null, status: 'QUALIFIED' } }),
            this.prisma.cRMContact.count({ where: { deletedAt: null, status: 'INTERESTED' } }),
            this.prisma.cRMContact.count({ where: { deletedAt: null, status: 'NEGOTIATION' } }),
            this.prisma.cRMContact.count({ where: { deletedAt: null, status: 'ENROLLED' } }),
            this.prisma.cRMContact.count({ where: { deletedAt: null, status: 'LOST' } }),
          ],
        );

        const conversionRate = total > 0 ? ((enrolled / total) * 100).toFixed(1) : '0';
        return { total, lead, qualified, interested, negotiation, enrolled, lost, conversionRate };
      },
      {
        total: 0,
        lead: 0,
        qualified: 0,
        interested: 0,
        negotiation: 0,
        enrolled: 0,
        lost: 0,
        conversionRate: '0',
      },
    );
  }

  // ════════════════════════════════════════
  // ATIVIDADES
  // ════════════════════════════════════════

  async findContactActivities(contactId: string) {
    return this.safeCrmRead(
      () =>
        this.prisma.cRMActivity.findMany({
          where: { contactId, deletedAt: null },
          include: {
            createdBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
      [],
    );
  }

  async createActivity(data: CreateActivityDto) {
    const activity = await this.prisma.cRMActivity.create({
      data: {
        contactId: data.contactId,
        type: data.type,
        title: data.title,
        description: data.description,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        createdById: data.createdById,
        metadata: (data.metadata || {}) as Prisma.InputJsonValue,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Atualizar lastContactAt do contato
    await this.prisma.cRMContact.update({
      where: { id: data.contactId },
      data: { lastContactAt: new Date() },
    });

    return activity;
  }

  async updateActivity(id: string, data: UpdateActivityDto) {
    const { metadata, ...rest } = data;
    return this.prisma.cRMActivity.update({
      where: { id },
      data: {
        ...rest,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
        ...(metadata && { metadata: metadata as Prisma.InputJsonValue }),
      },
    });
  }

  async deleteActivity(id: string) {
    return this.prisma.cRMActivity.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getPendingFollowUps() {
    return this.safeCrmRead(
      () =>
        this.prisma.cRMActivity.findMany({
          where: {
            deletedAt: null,
            completedAt: null,
            scheduledAt: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
          },
          include: {
            contact: { select: { id: true, name: true, code: true } },
            createdBy: { select: { id: true, name: true } },
          },
          orderBy: { scheduledAt: 'asc' },
        }),
      [],
    );
  }

  // ════════════════════════════════════════
  // DEALS (OPORTUNIDADES)
  // ════════════════════════════════════════

  private async generateDealCode(): Promise<string> {
    const last = await this.prisma.cRMDeal.findFirst({
      where: { code: { startsWith: 'D' } },
      orderBy: { code: 'desc' },
      select: { code: true },
    });
    const match = last?.code.match(/^D(\d{4})$/);
    const num = match ? parseInt(match[1], 10) + 1 : 1;
    return `D${String(num).padStart(4, '0')}`;
  }

  async findAllDeals(filters?: { status?: string; stageId?: string; contactId?: string }) {
    const where: any = { deletedAt: null };
    if (filters?.status) where.status = filters.status;
    if (filters?.stageId) where.stageId = filters.stageId;
    if (filters?.contactId) where.contactId = filters.contactId;

    return this.safeCrmRead(
      () =>
        this.prisma.cRMDeal.findMany({
          where,
          include: {
            contact: { select: { id: true, name: true, code: true, phone: true } },
            stage: { select: { id: true, name: true, color: true, order: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
      [],
    );
  }

  async createDeal(data: CreateDealDto) {
    const code = await this.generateDealCode();
    return this.prisma.cRMDeal.create({
      data: {
        code,
        contactId: data.contactId,
        stageId: data.stageId,
        title: data.title,
        value: data.value,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : undefined,
        courseId: data.courseId,
        classId: data.classId,
        notes: data.notes,
      },
      include: {
        contact: { select: { id: true, name: true, code: true } },
        stage: { select: { id: true, name: true, color: true } },
      },
    });
  }

  async updateDeal(id: string, data: UpdateDealDto) {
    return this.prisma.cRMDeal.update({
      where: { id },
      data: {
        ...data,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : undefined,
      },
    });
  }

  async moveDeal(id: string, data: MoveDealDto) {
    return this.prisma.cRMDeal.update({
      where: { id },
      data: { stageId: data.stageId },
      include: {
        stage: { select: { id: true, name: true, color: true } },
      },
    });
  }

  async markDealWon(id: string) {
    return this.prisma.cRMDeal.update({
      where: { id },
      data: { status: 'WON', wonAt: new Date() },
    });
  }

  async markDealLost(id: string, data: LostDealDto) {
    return this.prisma.cRMDeal.update({
      where: { id },
      data: { status: 'LOST', lostAt: new Date(), lostReason: data.reason },
    });
  }

  async deleteDeal(id: string) {
    return this.prisma.cRMDeal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getDealStats() {
    return this.safeCrmRead(
      async () => {
        const deals = await this.prisma.cRMDeal.findMany({
          where: { deletedAt: null },
          select: { status: true, value: true },
        });

        const totalValue = deals
          .filter((d) => d.status === 'OPEN')
          .reduce((acc, d) => acc + Number(d.value), 0);
        const wonValue = deals
          .filter((d) => d.status === 'WON')
          .reduce((acc, d) => acc + Number(d.value), 0);

        return {
          total: deals.length,
          open: deals.filter((d) => d.status === 'OPEN').length,
          won: deals.filter((d) => d.status === 'WON').length,
          lost: deals.filter((d) => d.status === 'LOST').length,
          totalValue,
          wonValue,
          winRate:
            deals.length > 0
              ? ((deals.filter((d) => d.status === 'WON').length / deals.length) * 100).toFixed(1)
              : '0',
        };
      },
      {
        total: 0,
        open: 0,
        won: 0,
        lost: 0,
        totalValue: 0,
        wonValue: 0,
        winRate: '0',
      },
    );
  }

  // ════════════════════════════════════════
  // PIPELINE STAGES
  // ════════════════════════════════════════

  async findAllStages() {
    return this.safeCrmRead(
      () =>
        this.prisma.cRMPipelineStage.findMany({
          where: { deletedAt: null, isActive: true },
          include: {
            _count: { select: { deals: { where: { deletedAt: null, status: 'OPEN' } } } },
          },
          orderBy: { order: 'asc' },
        }),
      [],
    );
  }

  async createStage(data: CreatePipelineStageDto) {
    return this.prisma.cRMPipelineStage.create({
      data: {
        name: data.name,
        order: data.order,
        color: data.color || '#6366f1',
        isDefault: data.isDefault || false,
      },
    });
  }

  async updateStage(id: string, data: UpdatePipelineStageDto) {
    return this.prisma.cRMPipelineStage.update({ where: { id }, data });
  }

  async reorderStages(data: ReorderPipelineDto) {
    const ops = data.stages.map((s) =>
      this.prisma.cRMPipelineStage.update({
        where: { id: s.id },
        data: { order: s.order },
      }),
    );
    return this.prisma.$transaction(ops);
  }

  async deleteStage(id: string) {
    const dealCount = await this.prisma.cRMDeal.count({
      where: { stageId: id, deletedAt: null, status: 'OPEN' },
    });
    if (dealCount > 0) {
      throw new ConflictException(
        `Não é possível excluir: existem ${dealCount} deal(s) aberto(s) neste estágio`,
      );
    }
    return this.prisma.cRMPipelineStage.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  // ════════════════════════════════════════
  // DASHBOARD / MÉTRICAS
  // ════════════════════════════════════════

  async getDashboard() {
    return this.safeCrmRead(
      async () => {
        const [contactStats, dealStats, pendingFollowUps, recentActivities] = await Promise.all([
          this.getContactStats(),
          this.getDealStats(),
          this.getPendingFollowUps(),
          this.prisma.cRMActivity.findMany({
            where: { deletedAt: null },
            include: {
              contact: { select: { id: true, name: true, code: true } },
              createdBy: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          }),
        ]);

        return { contactStats, dealStats, pendingFollowUps, recentActivities };
      },
      {
        contactStats: {
          total: 0,
          lead: 0,
          qualified: 0,
          interested: 0,
          negotiation: 0,
          enrolled: 0,
          lost: 0,
          conversionRate: '0',
        },
        dealStats: {
          total: 0,
          open: 0,
          won: 0,
          lost: 0,
          totalValue: 0,
          wonValue: 0,
          winRate: '0',
        },
        pendingFollowUps: [],
        recentActivities: [],
      },
    );
  }
}
