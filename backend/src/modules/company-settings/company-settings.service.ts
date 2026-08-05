import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';
import { EncryptionService } from '@/common/services/encryption.service';

@Injectable()
export class CompanySettingsService {
  // Campos que contêm dados sensíveis e devem ser criptografados
  private readonly sensitiveFields = ['bank', 'smtp', 'email', 'whatsapp'];

  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  /**
   * Descriptografa campos sensíveis das configurações
   */
  private decryptSettings(settings: Prisma.JsonValue): Prisma.JsonObject {
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      return {};
    }

    const decrypted: Prisma.JsonObject = { ...(settings as Prisma.JsonObject) };

    for (const field of this.sensitiveFields) {
      const value = decrypted[field];
      if (typeof value === 'string') {
        try {
          decrypted[field] = this.encryptionService.decrypt(value) as Prisma.JsonValue;
        } catch (error) {
          // Se falhar, pode ser dado não criptografado (migração)
          const message = error instanceof Error ? error.message : String(error);
          console.warn(`Failed to decrypt ${field}:`, message);
        }
      }
    }

    return decrypted;
  }

  /**
   * Criptografa campos sensíveis das configurações
   */
  private encryptSettings(settings: Prisma.JsonObject): Prisma.InputJsonValue {
    const encrypted: Prisma.JsonObject = { ...settings };

    for (const field of this.sensitiveFields) {
      const value = encrypted[field];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        encrypted[field] = this.encryptionService.encrypt(value) as Prisma.JsonValue;
      }
    }

    return encrypted as Prisma.InputJsonValue;
  }

  async getSettings(companyId: string) {
    const settings = await this.prisma.companySettings.findUnique({
      where: { companyId },
      include: { company: { select: { id: true, name: true, tradeName: true } } },
    });

    if (!settings) {
      // Criar settings padrão se não existir
      const newSettings = await this.prisma.companySettings.create({
        data: {
          companyId,
          settings: {},
        },
        include: { company: { select: { id: true, name: true, tradeName: true } } },
      });
      return newSettings;
    }

    // Descriptografar campos sensíveis antes de retornar
    const decryptedSettings = this.decryptSettings(settings.settings);

    return {
      ...settings,
      settings: decryptedSettings,
    };
  }

  async updateSettings(companyId: string, updateDto: UpdateCompanySettingsDto) {
    // Verificar se a empresa existe
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    // Buscar settings existentes ou criar
    const existing = await this.prisma.companySettings.findUnique({
      where: { companyId },
    });

    // Descriptografar settings existentes
    const currentSettings = existing ? this.decryptSettings(existing.settings) : {};

    // Merge com novos dados
    const newSettings: Prisma.JsonObject = {
      ...currentSettings,
      ...updateDto,
    } as Prisma.JsonObject;

    // Criptografar campos sensíveis antes de salvar
    const encryptedSettings = this.encryptSettings(newSettings) as Prisma.InputJsonValue;

    if (existing) {
      // Atualizar settings existentes
      const updated = await this.prisma.companySettings.update({
        where: { companyId },
        data: { settings: encryptedSettings },
        include: { company: { select: { id: true, name: true, tradeName: true } } },
      });

      // Retornar com dados descriptografados
      return {
        ...updated,
        settings: newSettings,
      };
    }

    // Criar novo settings
    const created = await this.prisma.companySettings.create({
      data: {
        companyId,
        settings: encryptedSettings,
      },
      include: { company: { select: { id: true, name: true, tradeName: true } } },
    });

    // Retornar com dados descriptografados
    return {
      ...created,
      settings: newSettings,
    };
  }

  async deleteSettings(companyId: string) {
    return this.prisma.companySettings.update({
      where: { companyId },
      data: { deletedAt: new Date() },
    });
  }
}
