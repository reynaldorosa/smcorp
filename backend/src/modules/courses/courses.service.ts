import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

type RequiredDocumentItem = {
  name: string;
  requiresUpload: boolean;
};

type CourseModuleMetadata = {
  allowSaturday?: boolean;
  allowSunday?: boolean;
  linkedProducts?: string[];
  linkedExtras?: string[];
  cashValue?: number;
  requiredDocuments?: RequiredDocumentItem[];
};

const COURSE_META_PREFIX = '__M01_META__:';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  private normalizeRequiredDocuments(
    rawDocuments?: Array<string | { name: string; requiresUpload?: boolean }>,
  ) {
    if (!Array.isArray(rawDocuments)) {
      return {
        names: [] as string[],
        detailed: [] as RequiredDocumentItem[],
      };
    }

    const seen = new Set<string>();
    const names: string[] = [];
    const detailed: RequiredDocumentItem[] = [];

    for (const raw of rawDocuments) {
      const name =
        typeof raw === 'string' ? raw.trim() : typeof raw?.name === 'string' ? raw.name.trim() : '';

      if (!name || seen.has(name)) {
        continue;
      }

      seen.add(name);
      names.push(name);
      detailed.push({
        name,
        requiresUpload: typeof raw === 'string' ? true : (raw.requiresUpload ?? true),
      });
    }

    return { names, detailed };
  }

  private parseCourseMetadata(rawCertificationInfo?: string | null) {
    if (!rawCertificationInfo || !rawCertificationInfo.startsWith(COURSE_META_PREFIX)) {
      return {
        certificationInfo: rawCertificationInfo ?? null,
        metadata: {} as CourseModuleMetadata,
      };
    }

    try {
      const payload = JSON.parse(rawCertificationInfo.slice(COURSE_META_PREFIX.length)) as {
        certificationInfo?: string | null;
        metadata?: CourseModuleMetadata;
      };

      return {
        certificationInfo: payload.certificationInfo ?? null,
        metadata: payload.metadata ?? {},
      };
    } catch {
      return {
        certificationInfo: rawCertificationInfo,
        metadata: {} as CourseModuleMetadata,
      };
    }
  }

  private serializeCourseMetadata(
    certificationInfo: string | null | undefined,
    metadata: CourseModuleMetadata,
  ) {
    const normalizedMetadata: CourseModuleMetadata = {};

    if (typeof metadata.allowSaturday === 'boolean') {
      normalizedMetadata.allowSaturday = metadata.allowSaturday;
    }

    if (typeof metadata.allowSunday === 'boolean') {
      normalizedMetadata.allowSunday = metadata.allowSunday;
    }

    if (Array.isArray(metadata.linkedProducts)) {
      normalizedMetadata.linkedProducts = metadata.linkedProducts;
    }

    if (Array.isArray(metadata.linkedExtras)) {
      normalizedMetadata.linkedExtras = metadata.linkedExtras;
    }

    if (typeof metadata.cashValue === 'number' && Number.isFinite(metadata.cashValue)) {
      normalizedMetadata.cashValue = metadata.cashValue;
    }

    if (Array.isArray(metadata.requiredDocuments) && metadata.requiredDocuments.length > 0) {
      normalizedMetadata.requiredDocuments = metadata.requiredDocuments;
    }

    const hasMetadata = Object.keys(normalizedMetadata).length > 0;
    if (!hasMetadata) {
      return certificationInfo ?? null;
    }

    return `${COURSE_META_PREFIX}${JSON.stringify({
      certificationInfo: certificationInfo ?? null,
      metadata: normalizedMetadata,
    })}`;
  }

  private mapCourseRecord<T extends Record<string, unknown>>(course: T) {
    const parsed = this.parseCourseMetadata(course.certificationInfo as string | null | undefined);

    const rawRequiredDocs = Array.isArray(course.requiredDocuments)
      ? (course.requiredDocuments as Array<string | { name: string; requiresUpload?: boolean }>)
      : [];

    const normalizedRequiredDocs = this.normalizeRequiredDocuments(rawRequiredDocs);
    const docsFromMetadata = parsed.metadata.requiredDocuments ?? [];
    const mergedDocs = normalizedRequiredDocs.names.map((name) => {
      const metaDoc = docsFromMetadata.find((doc) => doc.name === name);
      return {
        name,
        requiresUpload: metaDoc?.requiresUpload ?? true,
      };
    });

    return {
      ...course,
      certificationInfo: parsed.certificationInfo,
      allowSaturday:
        parsed.metadata.allowSaturday ?? (course.allowWeekends as boolean | undefined) ?? false,
      allowSunday:
        parsed.metadata.allowSunday ?? (course.allowWeekends as boolean | undefined) ?? false,
      linkedProducts: parsed.metadata.linkedProducts ?? [],
      linkedExtras: parsed.metadata.linkedExtras ?? [],
      cashValue: parsed.metadata.cashValue ?? 0,
      requiredDocuments: mergedDocs,
    };
  }

  async findAll(includeDeleted = false) {
    const courses = await this.prisma.course.findMany({
      // includeDeleted=true: usado pela tela de restauração (cursos excluídos
      // ficam visíveis na UI com a opção de restaurar)
      where: includeDeleted ? {} : { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return courses.map((course) => this.mapCourseRecord(course));
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        classes: {
          where: { deletedAt: null },
          include: {
            room: true,
            instructor: true,
            enrollments: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    if (!course || course.deletedAt) {
      throw new NotFoundException(`Curso ${id} não encontrado`);
    }

    return this.mapCourseRecord(course);
  }

  async create(data: CreateCourseDto) {
    const {
      allowSaturday,
      allowSunday,
      linkedProducts,
      linkedExtras,
      cashValue,
      requiredDocuments,
      ...baseData
    } = data;

    const normalizedRequiredDocs = this.normalizeRequiredDocuments(requiredDocuments);

    // Usar transação para evitar race condition na geração de código sequencial
    return this.prisma.$transaction(async (prisma) => {
      // Gerar código automático se não fornecido
      let code = baseData.code;

      if (!code) {
        // Buscar último curso com bloqueio para leitura
        const lastCourse = await prisma.course.findFirst({
          where: { code: { startsWith: 'C' } },
          orderBy: { code: 'desc' },
          select: { code: true },
        });

        // Validar formato do código e extrair número
        const match = lastCourse?.code.match(/^C(\d{4})$/);
        const lastNumber = match ? parseInt(match[1], 10) : 0;

        code = `C${String(lastNumber + 1).padStart(4, '0')}`;
      } else {
        // Se código manual fornecido, validar formato
        if (!/^C\d{4}$/.test(code)) {
          throw new BadRequestException('Código deve seguir o formato C0001 (C + 4 dígitos)');
        }

        // Verificar se código já existe (único por tenant — middleware
        // injeta tenantId automaticamente em findFirst)
        const existingCourse = await prisma.course.findFirst({
          where: { code },
        });

        if (existingCourse) {
          throw new ConflictException(`Código ${code} já existe`);
        }
      }

      const created = await prisma.course.create({
        data: {
          ...baseData,
          code,
          requiredDocuments: normalizedRequiredDocs.names,
          certificationInfo: this.serializeCourseMetadata(baseData.certificationInfo, {
            allowSaturday,
            allowSunday,
            linkedProducts,
            linkedExtras,
            cashValue,
            requiredDocuments: normalizedRequiredDocs.detailed,
          }),
        },
      });

      return this.mapCourseRecord(created);
    });
  }

  async update(id: string, data: UpdateCourseDto) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course || course.deletedAt) {
      throw new NotFoundException(`Curso ${id} não encontrado`);
    }

    const {
      allowSaturday,
      allowSunday,
      linkedProducts,
      linkedExtras,
      cashValue,
      requiredDocuments,
      ...baseData
    } = data;

    const parsedExisting = this.parseCourseMetadata(course.certificationInfo);

    const existingMetadata = parsedExisting.metadata;
    const nextMetadata: CourseModuleMetadata = {
      ...existingMetadata,
      ...(allowSaturday !== undefined ? { allowSaturday } : {}),
      ...(allowSunday !== undefined ? { allowSunday } : {}),
      ...(linkedProducts !== undefined ? { linkedProducts } : {}),
      ...(linkedExtras !== undefined ? { linkedExtras } : {}),
      ...(cashValue !== undefined ? { cashValue } : {}),
    };

    let normalizedRequiredDocs: { names: string[]; detailed: RequiredDocumentItem[] } | undefined;

    if (requiredDocuments !== undefined) {
      normalizedRequiredDocs = this.normalizeRequiredDocuments(requiredDocuments);
      nextMetadata.requiredDocuments = normalizedRequiredDocs.detailed;
    }

    const nextCertificationInfo = this.serializeCourseMetadata(
      baseData.certificationInfo ?? parsedExisting.certificationInfo,
      nextMetadata,
    );

    const updated = await this.prisma.course.update({
      where: { id: course.id },
      data: {
        ...baseData,
        ...(requiredDocuments !== undefined
          ? { requiredDocuments: normalizedRequiredDocs?.names ?? [] }
          : {}),
        certificationInfo: nextCertificationInfo,
      },
    });

    return this.mapCourseRecord(updated);
  }

  /**
   * SOFT DELETE: Marca curso como inativo, mas preserva histórico
   * - Alunos matriculados mantêm seus códigos A0001, A0002...
   * - Turmas antigas ficam visíveis como "Curso Excluído"
   * - Dados financeiros e histórico permanecem íntegros
   */
  async softDelete(id: string) {
    const course = await this.findOne(id);

    // Marca curso como inativo e registra data de exclusão
    await this.prisma.course.update({
      where: { id: course.id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return {
      message: `Curso ${course.code} - ${course.name} excluído com sucesso`,
      note: 'Histórico de alunos e turmas preservado',
    };
  }

  /**
   * REATIVAR curso excluído
   */
  async restore(id: string) {
    return this.prisma.course.update({
      where: { id },
      data: {
        isActive: true,
        deletedAt: null,
      },
    });
  }
}
