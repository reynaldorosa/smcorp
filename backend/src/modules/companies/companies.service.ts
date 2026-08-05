import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import * as bcrypt from 'bcryptjs';

type CompanyPricingRecord = {
  id?: string;
  courseId: string;
  basePrice?: number;
  discountPercent?: number;
  finalPrice: number;
  notes?: string;
  includedProductIds?: string[];
  validUntil?: string;
  active?: boolean;
};

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  private parseSettings(settings: unknown): Record<string, unknown> {
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      return {};
    }
    return settings as Record<string, unknown>;
  }

  private sanitizePricing(pricing: unknown): CompanyPricingRecord[] {
    if (!Array.isArray(pricing)) return [];

    return pricing
      .filter(
        (item): item is Record<string, unknown> =>
          !!item && typeof item === 'object' && !Array.isArray(item),
      )
      .filter(
        (item) =>
          typeof item.courseId === 'string' &&
          item.courseId.trim().length > 0 &&
          typeof item.finalPrice === 'number',
      )
      .map((item) => ({
        ...(typeof item.id === 'string' ? { id: item.id } : {}),
        courseId: item.courseId as string,
        ...(typeof item.basePrice === 'number' ? { basePrice: item.basePrice } : {}),
        ...(typeof item.discountPercent === 'number'
          ? { discountPercent: item.discountPercent }
          : {}),
        finalPrice: item.finalPrice as number,
        ...(typeof item.notes === 'string' ? { notes: item.notes } : {}),
        ...(Array.isArray(item.includedProductIds)
          ? {
              includedProductIds: item.includedProductIds.filter(
                (id): id is string => typeof id === 'string',
              ),
            }
          : {}),
        ...(typeof item.validUntil === 'string' ? { validUntil: item.validUntil } : {}),
        ...(typeof item.active === 'boolean' ? { active: item.active } : {}),
      }));
  }

  private async upsertCompanySettings(
    companyId: string,
    data: Pick<
      CreateCompanyDto,
      'portalAccess' | 'portalLogin' | 'portalPassword' | 'allowedPaymentMethods' | 'pricing'
    >,
  ) {
    if (
      data.portalAccess === undefined &&
      data.portalLogin === undefined &&
      data.portalPassword === undefined &&
      data.allowedPaymentMethods === undefined &&
      data.pricing === undefined
    ) {
      return;
    }

    const existingSettings = await this.prisma.companySettings.findUnique({
      where: { companyId },
      select: { settings: true },
    });

    const current = this.parseSettings(existingSettings?.settings);
    const currentPortal = this.parseSettings(current.portal);

    const nextPortal: Record<string, unknown> = {
      ...currentPortal,
      ...(data.portalAccess !== undefined ? { access: data.portalAccess } : {}),
      ...(data.portalLogin !== undefined ? { login: data.portalLogin.trim().toLowerCase() } : {}),
    };

    if (data.portalPassword !== undefined) {
      nextPortal.passwordHash = await bcrypt.hash(data.portalPassword, 10);
    }

    const currentCommercial = this.parseSettings(current.commercial);
    const nextCommercial: Record<string, unknown> = {
      ...currentCommercial,
      ...(data.allowedPaymentMethods !== undefined
        ? {
            allowedPaymentMethods: data.allowedPaymentMethods.filter(
              (method): method is string => typeof method === 'string' && method.trim().length > 0,
            ),
          }
        : {}),
      ...(data.pricing !== undefined ? { pricing: this.sanitizePricing(data.pricing) } : {}),
    };

    const nextSettings: Record<string, unknown> = {
      ...current,
      portal: nextPortal,
      commercial: nextCommercial,
    };
    const prismaSettings = nextSettings as Prisma.InputJsonValue;

    if (existingSettings) {
      await this.prisma.companySettings.update({
        where: { companyId },
        data: {
          settings: prismaSettings,
        },
      });
      return;
    }

    await this.prisma.companySettings.create({
      data: {
        companyId,
        settings: prismaSettings,
      },
    });
  }

  private mapCompany(
    record: { cnpj: string | null; settings?: { settings: Prisma.JsonValue } | null } & Record<
      string,
      unknown
    >,
  ) {
    const { cnpj, settings: companySettings, ...rest } = record;
    const settings = this.parseSettings(companySettings?.settings);
    const portal = this.parseSettings(settings.portal);
    const commercial = this.parseSettings(settings.commercial);

    const allowedPaymentMethods = Array.isArray(commercial.allowedPaymentMethods)
      ? commercial.allowedPaymentMethods.filter(
          (method): method is string => typeof method === 'string',
        )
      : [];

    const pricing = this.sanitizePricing(commercial.pricing);

    return {
      ...rest,
      companyTaxId: cnpj ?? undefined,
      portalAccess: Boolean(portal.access),
      portalLogin: typeof portal.login === 'string' ? portal.login : undefined,
      allowedPaymentMethods,
      pricing,
    };
  }

  async create(createDto: CreateCompanyDto) {
    // cnpj é único por tenant (não mais globalmente) — o middleware injeta
    // tenantId automaticamente em findFirst, igual faz para findMany/etc.
    const existing = await this.prisma.company.findFirst({
      where: { cnpj: createDto.companyTaxId },
    });

    if (existing && !existing.deletedAt) {
      throw new ConflictException('CNPJ já cadastrado');
    }

    const {
      companyTaxId,
      portalAccess,
      portalLogin,
      portalPassword,
      allowedPaymentMethods,
      pricing,
      ...data
    } = createDto;
    const created = await this.prisma.company.create({
      data: {
        ...data,
        cnpj: companyTaxId,
      },
      include: {
        settings: {
          select: { settings: true },
        },
      },
    });

    await this.upsertCompanySettings(created.id, {
      portalAccess,
      portalLogin,
      portalPassword,
      allowedPaymentMethods,
      pricing,
    });

    const createdWithSettings = await this.prisma.company.findUnique({
      where: { id: created.id },
      include: {
        settings: {
          select: { settings: true },
        },
      },
    });

    return this.mapCompany((createdWithSettings || created) as any);
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.company.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { students: true } },
          settings: {
            select: { settings: true },
          },
        },
      }),
      this.prisma.company.count({ where: { deletedAt: null } }),
    ]);

    return {
      data: data.map((item) => this.mapCompany(item)),
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        _count: { select: { students: true, payments: true } },
        settings: {
          select: { settings: true },
        },
      },
    });

    if (!company || company.deletedAt) {
      throw new NotFoundException('Empresa não encontrada');
    }
    return this.mapCompany(company);
  }

  async update(id: string, updateDto: UpdateCompanyDto) {
    await this.findOne(id);
    const {
      companyTaxId,
      portalAccess,
      portalLogin,
      portalPassword,
      allowedPaymentMethods,
      pricing,
      ...data
    } = updateDto;
    const prismaData = {
      ...data,
      ...(companyTaxId !== undefined ? { cnpj: companyTaxId } : {}),
    };
    const updated = await this.prisma.company.update({
      where: { id },
      data: prismaData,
      include: {
        settings: {
          select: { settings: true },
        },
      },
    });

    await this.upsertCompanySettings(id, {
      portalAccess,
      portalLogin,
      portalPassword,
      allowedPaymentMethods,
      pricing,
    });

    const updatedWithSettings = await this.prisma.company.findUnique({
      where: { id },
      include: {
        settings: {
          select: { settings: true },
        },
      },
    });

    return this.mapCompany((updatedWithSettings || updated) as any);
  }

  async remove(id: string) {
    await this.findOne(id);
    const removed = await this.prisma.company.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return this.mapCompany(removed);
  }

  /**
   * Lista alunos vinculados a uma empresa (paginado)
   */
  async getStudents(companyId: string, page = 1, limit = 20) {
    await this.findOne(companyId); // 404 se a empresa não existir

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.student.findMany({
        where: { companyId, deletedAt: null },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { enrollments: true } },
        },
      }),
      this.prisma.student.count({ where: { companyId, deletedAt: null } }),
    ]);

    return {
      data,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }
}
