import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  private mapSupplier(
    record: { cnpj: string | null; isActive?: boolean } & Record<string, unknown>,
  ) {
    const { cnpj, isActive, ...rest } = record;
    return {
      ...rest,
      companyTaxId: cnpj ?? undefined,
      active: isActive,
    };
  }

  private async generateSupplierCode() {
    let counter = await this.prisma.supplier.count();
    let code = `F${String(counter + 1).padStart(4, '0')}`;

    while (await this.prisma.supplier.findFirst({ where: { code } })) {
      counter += 1;
      code = `F${String(counter + 1).padStart(4, '0')}`;
    }

    return code;
  }

  async create(createDto: CreateSupplierDto) {
    const { companyTaxId, isActive, active, code, ...data } = createDto;
    const resolvedCode = code ?? (await this.generateSupplierCode());
    const resolvedActive = isActive ?? active;

    if (code) {
      const existing = await this.prisma.supplier.findFirst({ where: { code } });
      if (existing && !existing.deletedAt) {
        throw new ConflictException('Código do fornecedor já existe');
      }
    }

    const created = await this.prisma.supplier.create({
      data: {
        ...data,
        code: resolvedCode,
        cnpj: companyTaxId ?? null,
        ...(resolvedActive !== undefined ? { isActive: resolvedActive } : {}),
      },
    });
    return this.mapSupplier(created);
  }

  async findAll(page = 1, limit = 10, filters?: { active?: boolean }) {
    const skip = (page - 1) * limit;
    const where = {
      deletedAt: null as Date | null,
      ...(filters?.active !== undefined ? { isActive: filters.active } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return {
      data: data.map((item) => this.mapSupplier(item)),
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier || supplier.deletedAt) {
      throw new NotFoundException('Fornecedor não encontrado');
    }
    return this.mapSupplier(supplier);
  }

  async update(id: string, updateDto: UpdateSupplierDto) {
    await this.findOne(id);
    const { companyTaxId, isActive, active, code, ...data } = updateDto;
    const resolvedActive = isActive ?? active;

    if (code) {
      const existing = await this.prisma.supplier.findFirst({ where: { code } });
      if (existing && existing.id !== id && !existing.deletedAt) {
        throw new ConflictException('Código do fornecedor já existe');
      }
    }

    const prismaData = {
      ...data,
      ...(companyTaxId !== undefined ? { cnpj: companyTaxId } : {}),
      ...(resolvedActive !== undefined ? { isActive: resolvedActive } : {}),
      ...(code ? { code } : {}),
    };
    const updated = await this.prisma.supplier.update({
      where: { id },
      data: prismaData,
    });
    return this.mapSupplier(updated);
  }

  async remove(id: string) {
    await this.findOne(id);
    const removed = await this.prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return this.mapSupplier(removed);
  }
}
