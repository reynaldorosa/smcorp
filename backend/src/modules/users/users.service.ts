import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    // Check whether the email already exists.
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const { masterPin, ...createData } = createUserDto;

    // Hash the password.
    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
    const masterPinHash = masterPin ? await bcrypt.hash(masterPin, 12) : undefined;

    const user = await this.prisma.user.create({
      data: {
        ...createData,
        password: hashedPassword,
        ...(masterPinHash ? { masterPinHash } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    this.logger.log(`User created: ${user.email}`);
    return user;
  }

  async findAll(
    params: {
      skip?: number;
      take?: number;
      role?: UserRole;
      isActive?: boolean;
    } = {},
  ) {
    const { skip = 0, take = 10, role, isActive } = params;
    const safeSkip = Number.isFinite(skip) && skip >= 0 ? skip : 0;
    const safeTake = Number.isFinite(take) && take > 0 ? take : 10;

    const where = {
      deletedAt: null,
      ...(role && { role }),
      ...(isActive !== undefined && { isActive }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: safeSkip,
        take: safeTake,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page: Math.floor(safeSkip / safeTake) + 1,
        perPage: safeTake,
        totalPages: Math.ceil(total / safeTake),
      },
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        refreshToken: true,
        lastLoginAt: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findById(id);

    // If updating the email, check for conflicts.
    if (updateUserDto.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: updateUserDto.email,
          id: { not: id },
        },
      });

      if (existingUser) {
        throw new ConflictException('Email already registered');
      }
    }

    // Hash sensitive credentials if they are being updated.
    const { masterPin, ...rest } = updateUserDto;
    const data: Record<string, unknown> = { ...rest };
    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 12);
    }
    if (masterPin) {
      data.masterPinHash = await bcrypt.hash(masterPin, 12);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    this.logger.log(`User updated: ${user.email}`);
    return user;
  }

  async remove(id: string) {
    await this.findById(id);

    // Soft delete.
    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    this.logger.log(`User deleted: ${id}`);
    return { message: 'User removed successfully' };
  }

  async updateRefreshToken(id: string, refreshToken: string | null) {
    const hashedToken = refreshToken ? await bcrypt.hash(refreshToken, 12) : null;

    await this.prisma.user.update({
      where: { id },
      data: { refreshToken: hashedToken },
    });
  }

  async updateLastLogin(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }
}
