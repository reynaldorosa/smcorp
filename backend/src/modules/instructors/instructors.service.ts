import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';

@Injectable()
export class InstructorsService {
  constructor(private prisma: PrismaService) {}

  private mapInstructor(
    record: {
      cpf: string | null;
      specialties?: string[];
      isActive?: boolean;
      costPerHour?: unknown;
      costPerDay?: unknown;
    } & Record<string, unknown>,
  ) {
    const { cpf, specialties, isActive, costPerHour, costPerDay, ...rest } = record;
    const resolvedCostPerHour =
      costPerHour === null || costPerHour === undefined ? undefined : Number(costPerHour);
    const resolvedCostPerDay =
      costPerDay === null || costPerDay === undefined ? undefined : Number(costPerDay);
    return {
      ...rest,
      taxId: cpf ?? undefined,
      specializations: specialties ?? [],
      specialties,
      active: isActive,
      costPerHour: resolvedCostPerHour,
      costPerDay: resolvedCostPerDay,
    };
  }

  async create(createDto: CreateInstructorDto) {
    const {
      taxId,
      specialties,
      specializations,
      costPerHour,
      costPerDay,
      dailyRate,
      isActive,
      active,
      ...data
    } = createDto;

    const resolvedSpecialties = specialties ?? specializations ?? [];
    const resolvedCostPerDay = costPerDay ?? dailyRate;
    const resolvedActive = isActive ?? active;

    const created = await this.prisma.instructor.create({
      data: {
        ...data,
        cpf: taxId ?? null,
        specialties: resolvedSpecialties,
        ...(costPerHour !== undefined ? { costPerHour } : {}),
        ...(resolvedCostPerDay !== undefined ? { costPerDay: resolvedCostPerDay } : {}),
        ...(resolvedActive !== undefined ? { isActive: resolvedActive } : {}),
      },
    });
    return this.mapInstructor(created);
  }

  async findAll(page = 1, limit = 10, filters?: { active?: boolean }) {
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };

    if (filters?.active !== undefined) {
      where.isActive = filters.active;
    }

    const [data, total] = await Promise.all([
      this.prisma.instructor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.instructor.count({ where }),
    ]);

    return {
      data: data.map((item) => this.mapInstructor(item)),
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const instructor = await this.prisma.instructor.findUnique({ where: { id } });
    if (!instructor || instructor.deletedAt) {
      throw new NotFoundException('Instrutor não encontrado');
    }
    return this.mapInstructor(instructor);
  }

  async update(id: string, updateDto: UpdateInstructorDto) {
    await this.findOne(id);
    const {
      taxId,
      specialties,
      specializations,
      costPerHour,
      costPerDay,
      dailyRate,
      isActive,
      active,
      ...data
    } = updateDto;
    const resolvedSpecialties = specialties ?? specializations;
    const resolvedCostPerDay = costPerDay ?? dailyRate;
    const resolvedActive = isActive ?? active;
    const prismaData = {
      ...data,
      ...(taxId !== undefined ? { cpf: taxId } : {}),
      ...(resolvedSpecialties !== undefined ? { specialties: resolvedSpecialties } : {}),
      ...(costPerHour !== undefined ? { costPerHour } : {}),
      ...(resolvedCostPerDay !== undefined ? { costPerDay: resolvedCostPerDay } : {}),
      ...(resolvedActive !== undefined ? { isActive: resolvedActive } : {}),
    };
    const updated = await this.prisma.instructor.update({
      where: { id },
      data: prismaData,
    });
    return this.mapInstructor(updated);
  }

  async remove(id: string) {
    await this.findOne(id);
    const removed = await this.prisma.instructor.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return this.mapInstructor(removed);
  }
}
