import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateClassDto,
  UpdateClassDto,
  CalculateEndDateDto,
  CheckRoomConflictDto,
  CheckCapacityDto,
  GetClassesByRoomDto,
  GetClassesByInstructorDto,
} from './dto/class.dto';

/** Contrato consumido pelo frontend (classes.service.ts / classes.store.ts) */
export interface InstructorAttendanceView {
  /** YYYY-MM-DD */
  date: string;
  confirmedAt: string;
  confirmedBy: string;
}

export interface ClassInstructorWithAttendances {
  instructorId: string;
  attendances: InstructorAttendanceView[];
}

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeInstructorIds(instructorId?: string | null, instructorIds?: string[]): string[] {
    const base =
      instructorIds && instructorIds.length > 0
        ? instructorIds
        : instructorId
          ? [instructorId]
          : [];

    return Array.from(new Set(base.filter(Boolean)));
  }

  private async validateInstructors(instructorIds: string[]) {
    if (instructorIds.length === 0) return;

    const instructors = await this.prisma.instructor.findMany({
      where: { id: { in: instructorIds } },
      select: { id: true, isActive: true },
    });

    const foundIds = new Set(instructors.map((item) => item.id));
    const missing = instructorIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      throw new NotFoundException('Instrutor não encontrado');
    }

    if (instructors.some((item) => !item.isActive)) {
      throw new BadRequestException('Instrutor inativo');
    }
  }

  /**
   * Sincroniza os instrutores da turma (N:N).
   *
   * Antes isto era SQL cru com `catch {}` engolindo qualquer erro — se o INSERT
   * falhasse, a resposta saía como sucesso e os instrutores simplesmente não
   * eram vinculados, sem log. Agora usa o modelo Prisma (`ClassInstructor`),
   * numa transação e propagando falhas.
   */
  private async syncClassInstructors(classId: string, instructorIds: string[]) {
    await this.prisma.$transaction(async (tx) => {
      await tx.classInstructor.updateMany({
        where: { classId, deletedAt: null },
        data: { deletedAt: new Date() },
      });

      for (const instructorId of instructorIds) {
        // Reativa o vínculo se ele já existiu antes (o índice único da tabela
        // cobre apenas os vínculos ativos).
        const previous = await tx.classInstructor.findFirst({
          where: { classId, instructorId },
          orderBy: { createdAt: 'desc' },
        });

        if (previous) {
          await tx.classInstructor.update({
            where: { id: previous.id },
            data: { deletedAt: null },
          });
        } else {
          await tx.classInstructor.create({
            data: { classId, instructorId },
          });
        }
      }
    });
  }

  /** Vínculos ativos (com presença) das turmas informadas, agrupados por turma */
  private async getClassInstructorsMap(classIds: string[]) {
    const map = new Map<string, ClassInstructorWithAttendances[]>();
    if (classIds.length === 0) return map;

    const links = await this.prisma.classInstructor.findMany({
      where: { classId: { in: classIds }, deletedAt: null },
      include: {
        attendances: {
          where: { deletedAt: null },
          orderBy: { date: 'asc' },
          select: { date: true, confirmedAt: true, confirmedBy: true },
        },
      },
    });

    links.forEach((link) => {
      const current = map.get(link.classId) || [];
      current.push({
        instructorId: link.instructorId,
        attendances: link.attendances.map((item) => ({
          date: item.date.toISOString().slice(0, 10),
          confirmedAt: item.confirmedAt.toISOString(),
          confirmedBy: item.confirmedBy,
        })),
      });
      map.set(link.classId, current);
    });

    return map;
  }

  /**
   * Junta os vínculos N:N ao `instructorId` legado da turma.
   * O instrutor principal entra na lista mesmo sem vínculo em `class_instructors`.
   */
  private mergeInstructors(
    classItem: { id: string; instructorId?: string | null },
    map: Map<string, ClassInstructorWithAttendances[]>,
  ): ClassInstructorWithAttendances[] {
    const linked = map.get(classItem.id) || [];
    const linkedIds = new Set(linked.map((item) => item.instructorId));

    if (classItem.instructorId && !linkedIds.has(classItem.instructorId)) {
      return [...linked, { instructorId: classItem.instructorId, attendances: [] }];
    }

    return linked;
  }

  /**
   * Resolve o vínculo ativo turma↔instrutor.
   * Se o instrutor é o principal da turma (`instructorId` legado) mas ainda não
   * tem linha em `class_instructors`, o vínculo é criado sob demanda — assim a
   * presença funciona também nas turmas anteriores ao N:N.
   */
  private async resolveClassInstructor(classId: string, instructorId: string) {
    const existing = await this.prisma.classInstructor.findFirst({
      where: { classId, instructorId, deletedAt: null },
    });

    if (existing) return existing;

    const classItem = await this.prisma.class.findFirst({
      where: { id: classId, deletedAt: null },
      select: { id: true, instructorId: true },
    });

    if (!classItem) {
      throw new NotFoundException('Turma não encontrada');
    }

    if (classItem.instructorId !== instructorId) {
      throw new NotFoundException('Instrutor não está vinculado a esta turma');
    }

    return this.prisma.classInstructor.create({
      data: { classId, instructorId },
    });
  }

  /**
   * Confirma a presença do instrutor num dia de aula.
   * Idempotente: confirmar duas vezes o mesmo dia não duplica o registro.
   */
  async confirmInstructorAttendance(
    classId: string,
    instructorId: string,
    date: string,
    confirmedBy: string,
  ) {
    const link = await this.resolveClassInstructor(classId, instructorId);
    const day = new Date(`${date}T00:00:00.000Z`);

    const previous = await this.prisma.instructorAttendance.findFirst({
      where: { classInstructorId: link.id, date: day },
    });

    if (previous) {
      await this.prisma.instructorAttendance.update({
        where: { id: previous.id },
        data: { deletedAt: null, confirmedAt: new Date(), confirmedBy },
      });
    } else {
      await this.prisma.instructorAttendance.create({
        data: { classInstructorId: link.id, date: day, confirmedBy },
      });
    }

    return this.findOne(classId);
  }

  /** Remove a confirmação de presença do instrutor num dia (soft delete) */
  async removeInstructorAttendance(classId: string, instructorId: string, date: string) {
    const link = await this.prisma.classInstructor.findFirst({
      where: { classId, instructorId, deletedAt: null },
    });

    if (!link) {
      throw new NotFoundException('Instrutor não está vinculado a esta turma');
    }

    const day = new Date(`${date}T00:00:00.000Z`);
    const attendance = await this.prisma.instructorAttendance.findFirst({
      where: { classInstructorId: link.id, date: day, deletedAt: null },
    });

    if (!attendance) {
      throw new NotFoundException('Presença não encontrada para esta data');
    }

    await this.prisma.instructorAttendance.update({
      where: { id: attendance.id },
      data: { deletedAt: new Date() },
    });

    return this.findOne(classId);
  }

  private async enrichClassWithInstructors<T extends { id: string; instructorId?: string | null }>(
    classItem: T,
  ) {
    const map = await this.getClassInstructorsMap([classItem.id]);

    return {
      ...classItem,
      instructors: this.mergeInstructors(classItem, map),
    };
  }

  private async enrichClassesWithInstructors<
    T extends { id: string; instructorId?: string | null },
  >(classes: T[]) {
    const map = await this.getClassInstructorsMap(classes.map((item) => item.id));

    return classes.map((classItem) => ({
      ...classItem,
      instructors: this.mergeInstructors(classItem, map),
    }));
  }

  /**
   * Calcula data de término baseado em horas/dia e weekends
   * CORREÇÃO v4.13.1: Normalização UTC + ajuste de startDate em fim de semana
   * @param data - courseId + startDate
   * @returns Data calculada em UTC meia-noite
   */
  async calculateEndDate(data: CalculateEndDateDto): Promise<Date> {
    const course = await this.prisma.course.findUnique({
      where: { id: data.courseId },
      select: {
        durationHours: true,
        hoursPerDay: true,
        allowWeekends: true,
      },
    });

    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }

    if (!course.durationHours || !course.hoursPerDay) {
      throw new BadRequestException('Curso sem durationHours ou hoursPerDay definidos');
    }

    // Calcular dias necessários
    const totalDays = Math.ceil(course.durationHours / course.hoursPerDay);

    // Normalizar a data de início para meia-noite UTC (evita problemas de timezone)
    const startDate = new Date(data.startDate);
    const currentDate = new Date(
      Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()),
    );

    // Ajustar a data inicial se for fim de semana e não permitir fins de semana
    if (!course.allowWeekends) {
      let dayOfWeek = currentDate.getUTCDay();
      while (dayOfWeek === 0 || dayOfWeek === 6) {
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        dayOfWeek = currentDate.getUTCDay();
      }
    }

    let daysAdded = 1; // startDate (já ajustado) conta como primeiro dia de aula

    // Adicionar dias, pulando fins de semana se necessário
    while (daysAdded < totalDays) {
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);

      // Se allowWeekends = false, pular sábado (6) e domingo (0)
      if (!course.allowWeekends) {
        const dayOfWeek = currentDate.getUTCDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          continue; // Pula fim de semana
        }
      }

      daysAdded++;
    }

    return currentDate;
  }

  /**
   * Verifica conflito de sala em período
   * @param data - roomId, startDate, endDate
   * @returns true se há conflito, false se livre
   */
  async checkRoomConflict(data: CheckRoomConflictDto): Promise<boolean> {
    const where: Prisma.ClassWhereInput = {
      roomId: data.roomId,
      deletedAt: null,
      status: {
        in: ['SCHEDULED', 'IN_PROGRESS'], // Apenas turmas ativas
      },
      OR: [
        {
          // Conflito 1: Nova turma começa durante turma existente
          AND: [{ startDate: { lte: data.startDate } }, { endDate: { gte: data.startDate } }],
        },
        {
          // Conflito 2: Nova turma termina durante turma existente
          AND: [{ startDate: { lte: data.endDate } }, { endDate: { gte: data.endDate } }],
        },
        {
          // Conflito 3: Nova turma engloba turma existente
          AND: [{ startDate: { gte: data.startDate } }, { endDate: { lte: data.endDate } }],
        },
      ],
    };

    // Se é edição, excluir a própria turma
    if (data.excludeClassId) {
      where.id = { not: data.excludeClassId };
    }

    const conflictingClasses = await this.prisma.class.count({ where });

    return conflictingClasses > 0;
  }

  /**
   * Valida se capacidade da sala comporta a turma
   * @param data - classId
   * @throws ConflictException se capacidade excedida
   */
  async validateMaxCapacity(data: CheckCapacityDto): Promise<void> {
    const classWithEnrollments = await this.prisma.class.findUnique({
      where: { id: data.classId },
      include: {
        room: {
          select: {
            capacity: true,
            name: true,
          },
        },
        _count: {
          select: {
            enrollments: {
              where: {
                deletedAt: null,
                status: {
                  in: ['SCHEDULED', 'CONFIRMED', 'PRESENT'],
                },
              },
            },
          },
        },
      },
    });

    if (!classWithEnrollments) {
      throw new NotFoundException('Turma não encontrada');
    }

    if (!classWithEnrollments.room) {
      throw new BadRequestException('Turma sem sala definida');
    }

    const activeEnrollments = classWithEnrollments._count.enrollments;
    const roomCapacity = classWithEnrollments.room.capacity;

    if (activeEnrollments >= roomCapacity) {
      throw new ConflictException(
        `Capacidade excedida. Sala ${classWithEnrollments.room.name} comporta ${roomCapacity} alunos, ` +
          `mas já possui ${activeEnrollments} matrículas ativas.`,
      );
    }
  }

  /**
   * Gera código sequencial automático para turma (0001, 0002, etc.)
   */
  private async generateClassCode(): Promise<string> {
    const lastClass = await this.prisma.class.findFirst({
      where: { deletedAt: null },
      orderBy: { code: 'desc' },
      select: { code: true },
    });

    if (!lastClass) {
      return '0001';
    }

    // Extrai número do código e incrementa
    const lastNumber = parseInt(lastClass.code, 10);
    const nextNumber = lastNumber + 1;

    // Formata com zeros à esquerda (ex: 0001, 0002, ..., 9999)
    return nextNumber.toString().padStart(4, '0');
  }

  /**
   * Cria nova turma com validações automáticas
   * @param data - Dados da turma
   */
  async create(data: CreateClassDto) {
    // Gerar código automático se não fornecido
    const code = data.code || (await this.generateClassCode());

    // Validar curso
    const course = await this.prisma.course.findUnique({
      where: { id: data.courseId },
    });

    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }

    const instructorIds = this.normalizeInstructorIds(data.instructorId, data.instructorIds);
    await this.validateInstructors(instructorIds);
    const primaryInstructorId = instructorIds[0] ?? null;

    // Validar sala
    const room = await this.prisma.room.findUnique({
      where: { id: data.roomId },
    });

    if (!room) {
      throw new NotFoundException('Sala não encontrada');
    }

    if (!room.isActive) {
      throw new BadRequestException('Sala inativa');
    }

    // Validar empresa (opcional)
    if (data.companyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: data.companyId },
        select: { id: true, isActive: true },
      });

      if (!company) {
        throw new NotFoundException('Empresa não encontrada');
      }

      if (!company.isActive) {
        throw new BadRequestException('Empresa inativa');
      }
    }

    // Calcular endDate se não fornecido
    let endDate = data.endDate;
    if (!endDate) {
      endDate = await this.calculateEndDate({
        courseId: data.courseId,
        startDate: data.startDate,
      });
    }

    // Verificar conflito de sala
    const hasConflict = await this.checkRoomConflict({
      roomId: data.roomId,
      startDate: data.startDate,
      endDate,
    });

    if (hasConflict) {
      throw new ConflictException(
        `Conflito de agenda. Sala ${room.name} já está reservada no período selecionado.`,
      );
    }

    // Validar maxStudents vs capacidade da sala
    const maxStudents = data.maxStudents || room.capacity;
    if (maxStudents > room.capacity) {
      throw new BadRequestException(
        `Máximo de alunos (${maxStudents}) excede capacidade da sala (${room.capacity})`,
      );
    }

    // Criar turma
    const created = await this.prisma.class.create({
      data: {
        courseId: data.courseId,
        instructorId: primaryInstructorId,
        companyId: data.companyId ?? null,
        roomId: data.roomId,
        code,
        displayName: data.displayName,
        customPrice: data.customPrice,
        startDate: data.startDate,
        endDate,
        startTime: data.startTime || '08:00',
        endTime: data.endTime || '18:00',
        maxStudents,
        status: data.status || 'SCHEDULED',
      },
    });

    await this.syncClassInstructors(created.id, instructorIds);

    const hydrated = await this.prisma.class.findUnique({
      where: { id: created.id },
      include: {
        course: {
          select: {
            name: true,
            code: true,
          },
        },
        instructor: {
          select: {
            name: true,
          },
        },
        room: {
          select: {
            name: true,
            capacity: true,
          },
        },
      },
    });

    return this.enrichClassWithInstructors(hydrated!);
  }

  /**
   * Atualiza turma com validações
   * @param classId - ID da turma
   * @param data - Dados para atualizar
   */
  async update(classId: string, data: UpdateClassDto) {
    const existingClass = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!existingClass) {
      throw new NotFoundException('Turma não encontrada');
    }

    // Se mudou sala ou datas, validar conflito
    if (data.roomId || data.startDate || data.endDate) {
      const roomId = data.roomId || existingClass.roomId;
      const startDate = data.startDate || existingClass.startDate;
      let endDate = data.endDate || existingClass.endDate;

      // Recalcular endDate se mudou startDate mas não forneceu novo endDate
      if (data.startDate && !data.endDate && existingClass.courseId) {
        endDate = await this.calculateEndDate({
          courseId: existingClass.courseId,
          startDate: data.startDate,
        });
      }

      const hasConflict = await this.checkRoomConflict({
        roomId: roomId!,
        startDate,
        endDate,
        excludeClassId: classId,
      });

      if (hasConflict) {
        throw new ConflictException('Conflito de agenda com outra turma');
      }

      // Adicionar endDate recalculado aos dados de atualização
      if (data.startDate && !data.endDate) {
        data.endDate = endDate;
      }
    }

    const hasInstructorPayload =
      data.instructorIds !== undefined || data.instructorId !== undefined;

    let nextInstructorIds = existingClass.instructorId ? [existingClass.instructorId] : [];
    if (hasInstructorPayload) {
      nextInstructorIds = this.normalizeInstructorIds(
        data.instructorId ?? null,
        data.instructorIds,
      );
      await this.validateInstructors(nextInstructorIds);
    }

    const updateData: Prisma.ClassUpdateInput = {
      ...(data.courseId !== undefined ? { courseId: data.courseId } : {}),
      ...(data.companyId !== undefined ? { companyId: data.companyId } : {}),
      ...(data.roomId !== undefined ? { roomId: data.roomId } : {}),
      ...(data.code !== undefined ? { code: data.code } : {}),
      ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
      ...(data.customPrice !== undefined ? { customPrice: data.customPrice } : {}),
      ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
      ...(data.endDate !== undefined ? { endDate: data.endDate } : {}),
      ...(data.startTime !== undefined ? { startTime: data.startTime } : {}),
      ...(data.endTime !== undefined ? { endTime: data.endTime } : {}),
      ...(data.maxStudents !== undefined ? { maxStudents: data.maxStudents } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(hasInstructorPayload
        ? { instructorId: nextInstructorIds[0] ?? null }
        : data.instructorId !== undefined
          ? { instructorId: data.instructorId }
          : {}),
    };

    const updated = await this.prisma.class.update({
      where: { id: classId },
      data: updateData,
      include: {
        course: { select: { name: true } },
        instructor: { select: { name: true } },
        room: { select: { name: true } },
      },
    });

    if (hasInstructorPayload) {
      await this.syncClassInstructors(classId, nextInstructorIds);
    }

    return this.enrichClassWithInstructors(updated);
  }

  /**
   * Busca turmas de uma sala em período
   * @param data - Filtros de busca
   */
  async getClassesByRoom(data: GetClassesByRoomDto) {
    const where: Prisma.ClassWhereInput = {
      roomId: data.roomId,
      deletedAt: null,
    };

    if (data.startDate || data.endDate) {
      where.AND = [];
      if (data.startDate) {
        where.AND.push({ endDate: { gte: data.startDate } });
      }
      if (data.endDate) {
        where.AND.push({ startDate: { lte: data.endDate } });
      }
    }

    const classes = await this.prisma.class.findMany({
      where,
      include: {
        course: { select: { name: true, code: true } },
        instructor: { select: { name: true } },
        _count: {
          select: {
            enrollments: {
              where: {
                deletedAt: null,
                status: { in: ['SCHEDULED', 'CONFIRMED', 'PRESENT'] },
              },
            },
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    return this.enrichClassesWithInstructors(classes);
  }

  /**
   * Busca turmas de um instrutor em período
   * @param data - Filtros de busca
   */
  async getClassesByInstructor(data: GetClassesByInstructorDto) {
    const links = await this.prisma.classInstructor.findMany({
      where: { instructorId: data.instructorId, deletedAt: null },
      select: { classId: true },
    });
    const linkedClassIds = links.map((link) => link.classId);

    const where: Prisma.ClassWhereInput = {
      deletedAt: null,
      OR: [
        { instructorId: data.instructorId },
        ...(linkedClassIds.length > 0 ? [{ id: { in: linkedClassIds } }] : []),
      ],
    };

    if (data.startDate || data.endDate) {
      where.AND = [];
      if (data.startDate) {
        where.AND.push({ endDate: { gte: data.startDate } });
      }
      if (data.endDate) {
        where.AND.push({ startDate: { lte: data.endDate } });
      }
    }

    const classes = await this.prisma.class.findMany({
      where,
      include: {
        course: { select: { name: true, code: true } },
        room: { select: { name: true } },
        _count: {
          select: {
            enrollments: {
              where: {
                deletedAt: null,
                status: { in: ['SCHEDULED', 'CONFIRMED', 'PRESENT'] },
              },
            },
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    return this.enrichClassesWithInstructors(classes);
  }

  /**
   * Busca detalhes de uma turma
   * @param classId - ID da turma
   */
  async findOne(classId: string) {
    const classData = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        course: true,
        instructor: true,
        room: true,
        enrollments: {
          where: { deletedAt: null },
          include: {
            student: {
              select: {
                code: true,
                name: true,
                email: true,
                phone: true,
                photoUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!classData) {
      throw new NotFoundException('Turma não encontrada');
    }

    return this.enrichClassWithInstructors(classData);
  }

  /**
   * Lista todas as turmas com paginação
   */
  async findAll(
    page: number = 1,
    limit: number = 20,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      status?: string | string[];
    },
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.ClassWhereInput = { deletedAt: null };

    if (filters?.startDate || filters?.endDate) {
      const dateFilters = [];
      if (filters.startDate) {
        dateFilters.push({ endDate: { gte: filters.startDate } });
      }
      if (filters.endDate) {
        dateFilters.push({ startDate: { lte: filters.endDate } });
      }
      if (dateFilters.length > 0) {
        where.AND = dateFilters;
      }
    }

    if (filters?.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      where.status = { in: statuses as any };
    }

    const [classes, total] = await Promise.all([
      this.prisma.class.findMany({
        where,
        include: {
          course: { select: { name: true, code: true } },
          instructor: { select: { name: true } },
          room: { select: { name: true } },
          _count: {
            select: {
              enrollments: {
                where: {
                  deletedAt: null,
                  status: { in: ['SCHEDULED', 'CONFIRMED', 'PRESENT'] },
                },
              },
            },
          },
        },
        orderBy: { startDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.class.count({ where }),
    ]);

    const enriched = await this.enrichClassesWithInstructors(classes);

    return {
      data: enriched,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Lista todas as turmas incluindo datas de provas agendadas
   * Usado para exibir turmas no calendário nos dias de prova
   */
  async findAllWithExams() {
    const classes = await this.prisma.class.findMany({
      where: { deletedAt: null },
      include: {
        course: { select: { name: true, code: true } },
        instructor: { select: { name: true } },
        room: { select: { name: true } },
        enrollments: {
          where: { deletedAt: null },
          include: {
            student: {
              select: { id: true, code: true, name: true },
            },
            exams: {
              where: {
                deletedAt: null,
                status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
              },
              select: {
                id: true,
                scheduledDate: true,
                scheduledTime: true,
                examNumber: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    const enrichedClasses = await this.enrichClassesWithInstructors(classes);

    // Criar lista expandida: turma normal + turma nos dias de prova
    const expandedClasses: Array<Record<string, unknown>> = [];

    enrichedClasses.forEach((classItem) => {
      // Adicionar turma normal (para dias entre startDate e endDate)
      expandedClasses.push({
        ...classItem,
        isExamDay: false,
        examDate: null,
        examCount: 0,
      });

      // Coletar todas as datas de provas desta turma
      const examDates = new Map<string, Array<Record<string, unknown>>>();

      classItem.enrollments.forEach((enrollment) => {
        enrollment.exams.forEach((exam) => {
          const dateKey = exam.scheduledDate.toISOString().split('T')[0];
          if (!examDates.has(dateKey)) {
            examDates.set(dateKey, []);
          }
          examDates.get(dateKey)!.push({
            ...exam,
            studentCode: enrollment.student.code,
            studentName: enrollment.student.name,
          });
        });
      });

      // Adicionar entrada para cada dia de prova
      examDates.forEach((exams, dateKey) => {
        expandedClasses.push({
          ...classItem,
          isExamDay: true,
          examDate: new Date(dateKey),
          examCount: exams.length,
          examsInfo: exams,
        });
      });
    });

    return expandedClasses;
  }

  /**
   * Remove turma (soft delete)
   */
  async remove(classId: string) {
    const classData = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        _count: {
          select: {
            enrollments: {
              where: {
                deletedAt: null,
                status: { in: ['SCHEDULED', 'CONFIRMED', 'PRESENT'] },
              },
            },
          },
        },
      },
    });

    if (!classData) {
      throw new NotFoundException('Turma não encontrada');
    }

    if (classData._count.enrollments > 0) {
      throw new ConflictException('Não é possível remover turma com matrículas ativas');
    }

    return await this.prisma.class.update({
      where: { id: classId },
      data: { deletedAt: new Date() },
    });
  }
}
