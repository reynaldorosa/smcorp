import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

export interface AuditLogData {
  tableName: string;
  recordId: string;
  action: AuditAction;
  userId?: string;
  oldData?: unknown;
  newData?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async log(data: AuditLogData) {
    try {
      await this.prisma.auditLog.create({
        data: {
          tableName: data.tableName,
          recordId: data.recordId,
          action: data.action,
          userId: data.userId,
          oldData: data.oldData ?? undefined,
          newData: data.newData ?? undefined,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      // Não quebra a aplicação, mas NUNCA falha em silêncio — a trilha de
      // auditoria é um requisito regulatório, o erro precisa aparecer nos logs.
      this.logger.error(
        `Falha ao gravar log de auditoria (${data.tableName}/${data.recordId}/${data.action})`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async logCreate(
    tableName: string,
    recordId: string,
    newData: unknown,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.log({
      tableName,
      recordId,
      action: 'CREATE' as AuditAction,
      newData,
      userId,
      ipAddress,
      userAgent,
    });
  }

  async logUpdate(
    tableName: string,
    recordId: string,
    oldData: unknown,
    newData: unknown,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.log({
      tableName,
      recordId,
      action: 'UPDATE' as AuditAction,
      oldData,
      newData,
      userId,
      ipAddress,
      userAgent,
    });
  }

  async logDelete(
    tableName: string,
    recordId: string,
    oldData: unknown,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.log({
      tableName,
      recordId,
      action: 'DELETE' as AuditAction,
      oldData,
      userId,
      ipAddress,
      userAgent,
    });
  }

  async findByTable(tableName: string, limit = 100) {
    return this.prisma.auditLog.findMany({
      where: { tableName },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async findByRecord(tableName: string, recordId: string) {
    return this.prisma.auditLog.findMany({
      where: { tableName, recordId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async findByUser(userId: string, limit = 100) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}
