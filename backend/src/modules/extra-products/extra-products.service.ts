import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateExtraProductDto } from './dto/create-extra-product.dto';
import { UpdateExtraProductDto } from './dto/update-extra-product.dto';

@Injectable()
export class ExtraProductsService {
  constructor(private prisma: PrismaService) {}

  private mapExtraProduct(
    record: { associatedCostIds?: string[]; isActive?: boolean } & Record<string, unknown>,
  ) {
    const { associatedCostIds, isActive, ...rest } = record;
    return {
      ...rest,
      associatedCosts: associatedCostIds ?? [],
      active: isActive,
    };
  }

  private async generateExtraProductCode() {
    let counter = await this.prisma.extraProduct.count();
    let code = `EP${String(counter + 1).padStart(4, '0')}`;

    while (await this.prisma.extraProduct.findFirst({ where: { code } })) {
      counter += 1;
      code = `EP${String(counter + 1).padStart(4, '0')}`;
    }

    return code;
  }

  private normalizeAssociatedCosts(associatedCosts: string[]) {
    const seen = new Set<string>();
    const normalized: string[] = [];

    for (const rawId of associatedCosts) {
      const id = rawId?.trim();
      if (!id || seen.has(id)) {
        continue;
      }
      seen.add(id);
      normalized.push(id);
    }

    return normalized;
  }

  private async resolveAssociatedCosts(associatedCosts?: string[]) {
    if (associatedCosts === undefined) {
      return undefined;
    }

    const normalized = this.normalizeAssociatedCosts(associatedCosts);
    if (normalized.length === 0) {
      return [];
    }

    const existingCosts = await this.prisma.cost.findMany({
      where: {
        id: { in: normalized },
        deletedAt: null,
        isAuditable: true,
      },
      select: { id: true },
    });

    if (existingCosts.length !== normalized.length) {
      const existingIds = new Set(existingCosts.map((cost) => cost.id));
      const missingIds = normalized.filter((id) => !existingIds.has(id));
      throw new BadRequestException(`Custos auditaveis invalidos: ${missingIds.join(', ')}`);
    }

    return normalized;
  }

  async create(createDto: CreateExtraProductDto) {
    const { associatedCosts, isActive, active, code, type, ...data } = createDto;
    const resolvedCode = code ?? (await this.generateExtraProductCode());
    const resolvedActive = isActive ?? active;
    const resolvedType = type ?? 'extra';
    const resolvedAssociatedCosts = await this.resolveAssociatedCosts(associatedCosts);

    if (code) {
      const existing = await this.prisma.extraProduct.findFirst({ where: { code } });
      if (existing && !existing.deletedAt) {
        throw new ConflictException('Código do produto já existe');
      }
    }

    const created = await this.prisma.extraProduct.create({
      data: {
        ...data,
        code: resolvedCode,
        type: resolvedType,
        ...(resolvedAssociatedCosts !== undefined
          ? { associatedCostIds: resolvedAssociatedCosts }
          : {}),
        ...(resolvedActive !== undefined ? { isActive: resolvedActive } : {}),
      },
    });

    return this.mapExtraProduct(created);
  }

  async findAll(page = 1, limit = 10, filters?: { active?: boolean }) {
    const skip = (page - 1) * limit;
    const where = {
      deletedAt: null as Date | null,
      ...(filters?.active !== undefined ? { isActive: filters.active } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.extraProduct.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.extraProduct.count({ where }),
    ]);

    return {
      data: data.map((item) => this.mapExtraProduct(item)),
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.extraProduct.findUnique({ where: { id } });
    if (!product || product.deletedAt) {
      throw new NotFoundException('Produto não encontrado');
    }
    return this.mapExtraProduct(product);
  }

  async update(id: string, updateDto: UpdateExtraProductDto) {
    await this.findOne(id);
    const { associatedCosts, isActive, active, code, type, ...data } = updateDto;
    const resolvedActive = isActive ?? active;
    const resolvedAssociatedCosts = await this.resolveAssociatedCosts(associatedCosts);

    if (code) {
      const existing = await this.prisma.extraProduct.findFirst({ where: { code } });
      if (existing && existing.id !== id && !existing.deletedAt) {
        throw new ConflictException('Código do produto já existe');
      }
    }

    const updated = await this.prisma.extraProduct.update({
      where: { id },
      data: {
        ...data,
        ...(code ? { code } : {}),
        ...(type ? { type } : {}),
        ...(resolvedAssociatedCosts !== undefined
          ? { associatedCostIds: resolvedAssociatedCosts }
          : {}),
        ...(resolvedActive !== undefined ? { isActive: resolvedActive } : {}),
      },
    });

    return this.mapExtraProduct(updated);
  }

  async remove(id: string) {
    await this.findOne(id);
    const removed = await this.prisma.extraProduct.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return this.mapExtraProduct(removed);
  }
}
