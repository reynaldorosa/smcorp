import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  Prisma,
  CostCategory,
  CostFrequency,
  CostLinkage,
  CostDueCriterion,
  CostEntryStatus,
} from '@prisma/client';
import { CreateCostDto } from './dto/create-cost.dto';
import { UpdateCostDto } from './dto/update-cost.dto';
import { CreateCostEntryDto } from './dto/create-cost-entry.dto';
import { UpdateCostEntryDto } from './dto/update-cost-entry.dto';

type CostLinkType = 'none' | 'company' | 'instructor';

interface CostBindingsMeta {
  supplierId?: string;
  companyId?: string;
  instructorId?: string;
  linkType?: CostLinkType;
}

const COST_BINDINGS_PREFIX = '__SMC_COST_BINDINGS__:';
const COST_CATEGORIES: CostCategory[] = [
  'FIXED',
  'VARIABLE',
  'PERSONNEL',
  'INFRASTRUCTURE',
  'EQUIPMENT',
  'MATERIAL',
  'SERVICES',
  'OTHER',
];

@Injectable()
export class CostsService {
  constructor(private prisma: PrismaService) {}

  private normalizeBindings(bindings: CostBindingsMeta): CostBindingsMeta {
    const normalized: CostBindingsMeta = {
      supplierId: bindings.supplierId || undefined,
      companyId: bindings.companyId || undefined,
      instructorId: bindings.instructorId || undefined,
      linkType: bindings.linkType || undefined,
    };

    if (normalized.linkType === 'none') {
      return { linkType: 'none' };
    }

    if (normalized.linkType === 'company') {
      return {
        ...normalized,
        instructorId: undefined,
      };
    }

    if (normalized.linkType === 'instructor') {
      return {
        ...normalized,
        companyId: undefined,
      };
    }

    return normalized;
  }

  private hasBindings(bindings: CostBindingsMeta): boolean {
    return Boolean(
      bindings.supplierId || bindings.companyId || bindings.instructorId || bindings.linkType,
    );
  }

  private serializeCostNotes(notes: string | undefined, bindings: CostBindingsMeta): string | null {
    const normalizedBindings = this.normalizeBindings(bindings);
    const safeNotes = notes?.trim() || '';

    if (!this.hasBindings(normalizedBindings)) {
      return safeNotes || null;
    }

    return `${COST_BINDINGS_PREFIX}${JSON.stringify({
      notes: safeNotes || null,
      bindings: normalizedBindings,
    })}`;
  }

  private parseCostNotes(rawNotes?: string | null): {
    notes: string | null;
    bindings: CostBindingsMeta;
  } {
    if (!rawNotes) {
      return { notes: null, bindings: {} };
    }

    if (!rawNotes.startsWith(COST_BINDINGS_PREFIX)) {
      return { notes: rawNotes, bindings: {} };
    }

    try {
      const payload = JSON.parse(rawNotes.slice(COST_BINDINGS_PREFIX.length)) as {
        notes?: string | null;
        bindings?: CostBindingsMeta;
      };

      return {
        notes: payload.notes ?? null,
        bindings: this.normalizeBindings(payload.bindings || {}),
      };
    } catch {
      return { notes: rawNotes, bindings: {} };
    }
  }

  private mapCostResponse<T extends { notes?: string | null }>(cost: T) {
    const parsed = this.parseCostNotes(cost.notes);
    return {
      ...cost,
      notes: parsed.notes,
      supplierId: parsed.bindings.supplierId,
      companyId: parsed.bindings.companyId,
      instructorId: parsed.bindings.instructorId,
      linkType: parsed.bindings.linkType,
    };
  }

  async create(createDto: CreateCostDto) {
    const notes = this.serializeCostNotes(createDto.notes, {
      supplierId: createDto.supplierId,
      companyId: createDto.companyId,
      instructorId: createDto.instructorId,
      linkType: createDto.linkType,
    });

    const created = await this.prisma.cost.create({
      data: {
        category: createDto.category as CostCategory,
        description: createDto.description,
        amount: createDto.amount,
        period: new Date(createDto.period),
        isRecurring: createDto.isRecurring ?? false,
        isAuditable: createDto.isAuditable ?? false,
        notes,
      },
    });

    return this.mapCostResponse(created);
  }

  async findAll(
    page = 1,
    limit = 10,
    isAuditable?: boolean,
    category?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const skip = (page - 1) * limit;
    const normalizedCategory =
      category && COST_CATEGORIES.includes(category as CostCategory)
        ? (category as CostCategory)
        : undefined;

    const periodFilter: Prisma.DateTimeFilter | undefined =
      startDate || endDate
        ? {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            ...(endDate ? { lte: new Date(endDate) } : {}),
          }
        : undefined;

    const where: Prisma.CostWhereInput = {
      deletedAt: null,
      ...(isAuditable === undefined ? {} : { isAuditable }),
      ...(normalizedCategory ? { category: normalizedCategory } : {}),
      ...(periodFilter ? { period: periodFilter } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.cost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { period: 'desc' },
      }),
      this.prisma.cost.count({ where }),
    ]);

    return {
      data: data.map((cost) => this.mapCostResponse(cost)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const cost = await this.prisma.cost.findUnique({ where: { id } });
    if (!cost || cost.deletedAt) {
      throw new NotFoundException('Custo não encontrado');
    }
    return this.mapCostResponse(cost);
  }

  async update(id: string, updateDto: UpdateCostDto) {
    const existing = await this.prisma.cost.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Custo não encontrado');
    }

    const currentParsed = this.parseCostNotes(existing.notes);
    const mergedBindings = this.normalizeBindings({
      supplierId:
        updateDto.supplierId !== undefined
          ? updateDto.supplierId
          : currentParsed.bindings.supplierId,
      companyId:
        updateDto.companyId !== undefined ? updateDto.companyId : currentParsed.bindings.companyId,
      instructorId:
        updateDto.instructorId !== undefined
          ? updateDto.instructorId
          : currentParsed.bindings.instructorId,
      linkType:
        updateDto.linkType !== undefined ? updateDto.linkType : currentParsed.bindings.linkType,
    });

    const plainNotes =
      updateDto.notes !== undefined ? updateDto.notes : (currentParsed.notes ?? undefined);
    const notes = this.serializeCostNotes(plainNotes, mergedBindings);

    const data: Prisma.CostUpdateInput = {
      notes,
    };
    if (updateDto.category) {
      data.category = updateDto.category as CostCategory;
    }
    if (updateDto.description !== undefined) {
      data.description = updateDto.description;
    }
    if (updateDto.amount !== undefined) {
      data.amount = updateDto.amount;
    }
    if (updateDto.period) {
      data.period = new Date(updateDto.period);
    }
    if (updateDto.isRecurring !== undefined) {
      data.isRecurring = updateDto.isRecurring;
    }
    if (updateDto.isAuditable !== undefined) {
      data.isAuditable = updateDto.isAuditable;
    }

    const updated = await this.prisma.cost.update({ where: { id }, data });
    return this.mapCostResponse(updated);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.cost.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ============================================
  // COST ENTRIES CRUD
  // ============================================

  async createEntry(data: CreateCostEntryDto) {
    return this.prisma.costEntry.create({
      data: {
        ...(data.id && { id: data.id }),
        code: data.code,
        auditableCostId: data.auditableCostId,
        costCriterionId: data.costCriterionId,
        studentId: data.studentId,
        classId: data.classId,
        supplierId: data.supplierId,
        instructorId: data.instructorId,
        companyId: data.companyId,
        examNumber: data.examNumber,
        examName: data.examName,
        value: data.value,
        generatedAt: new Date(data.generatedAt),
        dueDate: new Date(data.dueDate),
        paidAt: data.paidAt ? new Date(data.paidAt) : undefined,
        status: (data.status || 'PENDING') as CostEntryStatus,
        notes: data.notes,
        autoGenerated: data.autoGenerated ?? false,
        triggerAction: data.triggerAction,
      },
    });
  }

  async findAllEntries(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const where: Prisma.CostEntryWhereInput = { deletedAt: null };

    const [data, total] = await Promise.all([
      this.prisma.costEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.costEntry.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOneEntry(id: string) {
    const entry = await this.prisma.costEntry.findUnique({ where: { id } });
    if (!entry || entry.deletedAt) {
      throw new NotFoundException('Lançamento de custo não encontrado');
    }
    return entry;
  }

  async updateEntry(id: string, data: UpdateCostEntryDto) {
    await this.findOneEntry(id);

    const updateData: Prisma.CostEntryUncheckedUpdateInput = {};

    if (data.code !== undefined) updateData.code = data.code;
    if (data.auditableCostId !== undefined) updateData.auditableCostId = data.auditableCostId;
    if (data.costCriterionId !== undefined) updateData.costCriterionId = data.costCriterionId;
    if (data.studentId !== undefined) updateData.studentId = data.studentId;
    if (data.classId !== undefined) updateData.classId = data.classId;
    if (data.supplierId !== undefined) updateData.supplierId = data.supplierId;
    if (data.instructorId !== undefined) updateData.instructorId = data.instructorId;
    if (data.companyId !== undefined) updateData.companyId = data.companyId;
    if (data.examNumber !== undefined) updateData.examNumber = data.examNumber;
    if (data.examName !== undefined) updateData.examName = data.examName;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.generatedAt !== undefined) updateData.generatedAt = new Date(data.generatedAt);
    if (data.dueDate !== undefined) updateData.dueDate = new Date(data.dueDate);
    if (data.paidAt !== undefined) updateData.paidAt = data.paidAt ? new Date(data.paidAt) : null;
    if (data.status !== undefined) updateData.status = data.status as CostEntryStatus;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.autoGenerated !== undefined) updateData.autoGenerated = data.autoGenerated;
    if (data.triggerAction !== undefined) updateData.triggerAction = data.triggerAction;

    return this.prisma.costEntry.update({ where: { id }, data: updateData });
  }

  async payEntry(id: string, paidAt?: string) {
    await this.findOneEntry(id);
    return this.prisma.costEntry.update({
      where: { id },
      data: {
        status: CostEntryStatus.PAID,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
      },
    });
  }

  async removeEntry(id: string) {
    await this.findOneEntry(id);
    return this.prisma.costEntry.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ============================================
  // COST CRITERIA CRUD
  // ============================================

  async createCriterion(data: {
    name: string;
    frequency: string;
    linkage: string;
    dueCriterion: string;
    daysUntilDue?: number;
    monthlyClosingDay?: number;
    daysAfterClosing?: number;
    notes?: string;
  }) {
    const lastCriterion = await this.prisma.costCriterion.findFirst({
      orderBy: { code: 'desc' },
    });
    const nextNum = lastCriterion ? parseInt(lastCriterion.code.replace('CR', '')) + 1 : 1;
    const code = `CR${String(nextNum).padStart(4, '0')}`;

    return this.prisma.costCriterion.create({
      data: {
        code,
        name: data.name,
        frequency: data.frequency as CostFrequency,
        linkage: data.linkage as CostLinkage,
        dueCriterion: data.dueCriterion as CostDueCriterion,
        daysUntilDue: data.daysUntilDue,
        monthlyClosingDay: data.monthlyClosingDay,
        daysAfterClosing: data.daysAfterClosing,
        notes: data.notes,
      },
    });
  }

  async findAllCriteria(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.costCriterion.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        orderBy: { code: 'asc' },
      }),
      this.prisma.costCriterion.count({ where: { deletedAt: null } }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOneCriterion(id: string) {
    const criterion = await this.prisma.costCriterion.findUnique({ where: { id } });
    if (!criterion || criterion.deletedAt) {
      throw new NotFoundException('Critério de custo não encontrado');
    }
    return criterion;
  }

  async updateCriterion(
    id: string,
    data: Partial<{
      name: string;
      frequency: string;
      linkage: string;
      dueCriterion: string;
      daysUntilDue: number;
      monthlyClosingDay: number;
      daysAfterClosing: number;
      isActive: boolean;
      notes: string;
    }>,
  ) {
    await this.findOneCriterion(id);
    const updateData: Prisma.CostCriterionUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.frequency) updateData.frequency = data.frequency as CostFrequency;
    if (data.linkage) updateData.linkage = data.linkage as CostLinkage;
    if (data.dueCriterion) updateData.dueCriterion = data.dueCriterion as CostDueCriterion;
    if (data.daysUntilDue !== undefined) updateData.daysUntilDue = data.daysUntilDue;
    if (data.monthlyClosingDay !== undefined) updateData.monthlyClosingDay = data.monthlyClosingDay;
    if (data.daysAfterClosing !== undefined) updateData.daysAfterClosing = data.daysAfterClosing;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.notes !== undefined) updateData.notes = data.notes;
    return this.prisma.costCriterion.update({ where: { id }, data: updateData });
  }

  async removeCriterion(id: string) {
    await this.findOneCriterion(id);
    return this.prisma.costCriterion.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
