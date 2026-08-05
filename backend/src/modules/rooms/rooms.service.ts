import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  private mapRoom(record: { costPerDay?: unknown; isActive?: boolean } & Record<string, unknown>) {
    const { costPerDay, isActive, ...rest } = record;
    const dailyCost =
      costPerDay === null || costPerDay === undefined ? undefined : Number(costPerDay);

    return {
      ...rest,
      dailyCost,
      active: isActive,
    };
  }

  private async generateRoomCode() {
    let counter = await this.prisma.room.count();
    let code = `R${String(counter + 1).padStart(4, '0')}`;

    while (await this.prisma.room.findFirst({ where: { code } })) {
      counter += 1;
      code = `R${String(counter + 1).padStart(4, '0')}`;
    }

    return code;
  }

  async create(createDto: CreateRoomDto) {
    const { costPerDay, dailyCost, isActive, active, code, ...data } = createDto;
    const resolvedCode = code ?? (await this.generateRoomCode());

    if (code) {
      const existing = await this.prisma.room.findFirst({
        where: { code },
      });

      if (existing && !existing.deletedAt) {
        throw new ConflictException('Código da sala já existe');
      }
    }

    const resolvedCostPerDay = costPerDay ?? dailyCost;
    const resolvedActive = isActive ?? active;

    const created = await this.prisma.room.create({
      data: {
        ...data,
        code: resolvedCode,
        ...(resolvedCostPerDay !== undefined ? { costPerDay: resolvedCostPerDay } : {}),
        ...(resolvedActive !== undefined ? { isActive: resolvedActive } : {}),
      },
    });

    return this.mapRoom(created);
  }

  async findAll(page = 1, limit = 10, filters?: { active?: boolean }) {
    const skip = (page - 1) * limit;
    const where = {
      deletedAt: null as Date | null,
      ...(filters?.active !== undefined ? { isActive: filters.active } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.room.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.room.count({ where }),
    ]);

    return {
      data: data.map((item) => this.mapRoom(item)),
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room || room.deletedAt) {
      throw new NotFoundException('Sala não encontrada');
    }
    return this.mapRoom(room);
  }

  async update(id: string, updateDto: UpdateRoomDto) {
    const existing = await this.prisma.room.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Sala não encontrada');
    }

    const { costPerDay, dailyCost, isActive, active, code, ...data } = updateDto;
    const resolvedCostPerDay = costPerDay ?? dailyCost;
    const resolvedActive = isActive ?? active;

    if (code) {
      const codeOwner = await this.prisma.room.findFirst({ where: { code } });
      if (codeOwner && codeOwner.id !== id && !codeOwner.deletedAt) {
        throw new ConflictException('Código da sala já existe');
      }
    }

    const updated = await this.prisma.room.update({
      where: { id },
      data: {
        ...data,
        ...(code ? { code } : {}),
        ...(resolvedCostPerDay !== undefined ? { costPerDay: resolvedCostPerDay } : {}),
        ...(resolvedActive !== undefined ? { isActive: resolvedActive } : {}),
      },
    });

    return this.mapRoom(updated);
  }

  async remove(id: string) {
    await this.findOne(id);
    const removed = await this.prisma.room.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return this.mapRoom(removed);
  }
}
