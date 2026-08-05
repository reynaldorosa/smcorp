import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  ScheduleExamDto,
  RecordExamResultDto,
  UpdateExamStatusDto,
  CancelExamDto,
  GetExamsByEnrollmentDto,
  GetExamsByInstructorDto,
} from './dto/exam.dto';

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOperationalExams() {
    const exams = await this.prisma.exam.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        examNumber: true,
        examType: true,
        scheduledDate: true,
        scheduledTime: true,
        instructorId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        enrollment: {
          select: {
            studentId: true,
            classId: true,
          },
        },
      },
      orderBy: [{ scheduledDate: 'asc' }, { scheduledTime: 'asc' }],
    });

    const grouped = new Map<
      string,
      {
        id: string;
        backendExamIds: string[];
        classId: string;
        examNumber: string;
        examName: string;
        date: string;
        time: string;
        instructorId: string;
        studentIds: string[];
        status: 'Scheduled' | 'Cancelled';
        createdAt: string;
        updatedAt: string;
      }
    >();

    for (const exam of exams) {
      const classId = exam.enrollment.classId;
      const date = exam.scheduledDate.toISOString().slice(0, 10);
      const status = exam.status === 'CANCELLED' ? 'Cancelled' : 'Scheduled';
      const key = `${classId}::${exam.examNumber}::${exam.examType || 'Prova'}::${exam.instructorId}::${date}::${exam.scheduledTime}`;

      const existing = grouped.get(key);
      if (!existing) {
        grouped.set(key, {
          id: key,
          backendExamIds: [exam.id],
          classId,
          examNumber: exam.examNumber,
          examName: exam.examType || 'Prova',
          date,
          time: exam.scheduledTime,
          instructorId: exam.instructorId,
          studentIds: [exam.enrollment.studentId],
          status,
          createdAt: exam.createdAt.toISOString(),
          updatedAt: exam.updatedAt.toISOString(),
        });
        continue;
      }

      existing.backendExamIds.push(exam.id);
      if (!existing.studentIds.includes(exam.enrollment.studentId)) {
        existing.studentIds.push(exam.enrollment.studentId);
      }
      if (exam.createdAt.toISOString() < existing.createdAt) {
        existing.createdAt = exam.createdAt.toISOString();
      }
      if (exam.updatedAt.toISOString() > existing.updatedAt) {
        existing.updatedAt = exam.updatedAt.toISOString();
      }
      if (status === 'Cancelled') {
        existing.status = 'Cancelled';
      }
    }

    return Array.from(grouped.values());
  }

  /**
   * Gera código sequencial para prova (P0001, P0002...)
   */
  private async generateExamCode(): Promise<string> {
    const lastExam = await this.prisma.exam.findFirst({
      where: {
        examCode: {
          startsWith: 'P',
        },
      },
      orderBy: {
        examCode: 'desc',
      },
      select: {
        examCode: true,
      },
    });

    if (!lastExam) {
      return 'P0001';
    }

    const lastNumber = parseInt(lastExam.examCode.substring(1), 10);
    const nextNumber = lastNumber + 1;
    return `P${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Agenda prova para um aluno
   * BLOQUEIO: Só permite agendar se enrollment.documentsStatus === 'COMPLETE'
   * @param data - Dados da prova
   */
  async scheduleExam(data: ScheduleExamDto) {
    // Verificar se matrícula existe
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: data.enrollmentId },
      include: {
        student: {
          select: {
            name: true,
          },
        },
        class: {
          include: {
            course: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Matrícula não encontrada');
    }

    // 🔴 BLOQUEIO: Verificar se documentos estão completos
    if (enrollment.documentsStatus !== 'COMPLETE') {
      throw new ForbiddenException(
        'Não é possível agendar prova. Documentos pendentes. Status atual: ' +
          enrollment.documentsStatus,
      );
    }

    // Verificar se instrutor existe
    const instructor = await this.prisma.instructor.findUnique({
      where: { id: data.instructorId },
    });

    if (!instructor) {
      throw new NotFoundException('Instrutor não encontrado');
    }

    if (!instructor.isActive) {
      throw new BadRequestException('Instrutor inativo');
    }

    // Verificar se já existe prova SCHEDULED ou IN_PROGRESS para esta matrícula
    const existingExam = await this.prisma.exam.findFirst({
      where: {
        enrollmentId: data.enrollmentId,
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS'],
        },
        deletedAt: null,
      },
    });

    if (existingExam) {
      throw new BadRequestException(
        'Já existe uma prova agendada ou em andamento para esta matrícula',
      );
    }

    // Gerar código sequencial
    const examCode = await this.generateExamCode();

    // Criar prova
    const exam = await this.prisma.exam.create({
      data: {
        examCode,
        enrollmentId: data.enrollmentId,
        courseId: data.courseId,
        instructorId: data.instructorId,
        examNumber: data.examNumber,
        examType: data.examType,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        duration: data.duration,
        status: 'SCHEDULED',
        notes: data.notes,
      },
      include: {
        enrollment: {
          select: {
            student: {
              select: {
                name: true,
              },
            },
          },
        },
        course: {
          select: {
            name: true,
          },
        },
        instructor: {
          select: {
            name: true,
          },
        },
      },
    });

    return exam;
  }

  /**
   * Verifica se pode agendar prova (documentos OK?)
   * @param enrollmentId - ID da matrícula
   * @returns true se pode agendar, false caso contrário
   */
  async canScheduleExam(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: {
        documentsStatus: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Matrícula não encontrada');
    }

    return {
      canSchedule: enrollment.documentsStatus === 'COMPLETE',
      documentsStatus: enrollment.documentsStatus,
      message:
        enrollment.documentsStatus === 'COMPLETE'
          ? 'Pode agendar prova'
          : `Documentos ${enrollment.documentsStatus}. Valide [DOC] primeiro.`,
    };
  }

  /**
   * Registra resultado da prova
   * @param data - Dados do resultado
   */
  async recordExamResult(data: RecordExamResultDto) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: data.examId },
      include: {
        enrollment: {
          select: {
            student: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Prova não encontrada');
    }

    if (exam.status === 'CANCELLED') {
      throw new BadRequestException('Prova foi cancelada');
    }

    if (exam.status === 'COMPLETED' || exam.status === 'APPROVED' || exam.status === 'FAILED') {
      throw new BadRequestException('Resultado já foi registrado para esta prova');
    }

    // Atualizar prova com resultado
    const updatedExam = await this.prisma.exam.update({
      where: { id: data.examId },
      data: {
        score: data.score,
        passed: data.passed,
        status: data.passed ? 'APPROVED' : 'FAILED',
        notes: data.notes,
      },
      include: {
        enrollment: {
          select: {
            student: {
              select: {
                name: true,
              },
            },
          },
        },
        instructor: {
          select: {
            name: true,
          },
        },
      },
    });

    return updatedExam;
  }

  /**
   * Atualiza status da prova
   * @param data - Novo status
   */
  async updateStatus(data: UpdateExamStatusDto) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: data.examId },
    });

    if (!exam) {
      throw new NotFoundException('Prova não encontrada');
    }

    if (exam.status === 'CANCELLED') {
      throw new BadRequestException('Prova cancelada não pode ter status alterado');
    }

    return await this.prisma.exam.update({
      where: { id: data.examId },
      data: {
        status: data.status,
      },
    });
  }

  /**
   * Cancela prova (versão legacy com reason)
   * @param data - Dados de cancelamento
   */
  async cancelExamWithReason(data: CancelExamDto) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: data.examId },
    });

    if (!exam) {
      throw new NotFoundException('Prova não encontrada');
    }

    if (exam.status === 'COMPLETED' || exam.status === 'APPROVED' || exam.status === 'FAILED') {
      throw new BadRequestException('Não é possível cancelar prova já finalizada');
    }

    return await this.prisma.exam.update({
      where: { id: data.examId },
      data: {
        status: 'CANCELLED',
        notes: `CANCELADO: ${data.reason}`,
      },
    });
  }

  /**
   * Busca provas de uma matrícula
   * @param data - ID da matrícula
   */
  async getExamsByEnrollment(data: GetExamsByEnrollmentDto) {
    const exams = await this.prisma.exam.findMany({
      where: {
        enrollmentId: data.enrollmentId,
        deletedAt: null,
      },
      include: {
        instructor: {
          select: {
            name: true,
          },
        },
        course: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        scheduledDate: 'desc',
      },
    });

    return exams;
  }

  /**
   * Busca provas de um instrutor em um período
   * @param data - Filtros de busca
   */
  async getExamsByInstructor(data: GetExamsByInstructorDto) {
    const where: Prisma.ExamWhereInput = {
      instructorId: data.instructorId,
      deletedAt: null,
    };

    if (data.startDate || data.endDate) {
      where.scheduledDate = {};
      if (data.startDate) where.scheduledDate.gte = data.startDate;
      if (data.endDate) where.scheduledDate.lte = data.endDate;
    }

    const exams = await this.prisma.exam.findMany({
      where,
      include: {
        enrollment: {
          select: {
            student: {
              select: {
                name: true,
              },
            },
          },
        },
        course: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });

    return exams;
  }

  /**
   * Busca detalhes de uma prova
   * @param examId - ID da prova
   */
  async findOne(examId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        enrollment: {
          include: {
            student: {
              select: {
                name: true,
                email: true,
                phone: true,
                photoUrl: true,
              },
            },
            class: {
              select: {
                code: true,
              },
            },
          },
        },
        course: {
          select: {
            name: true,
            code: true,
          },
        },
        instructor: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Prova não encontrada');
    }

    return exam;
  }

  /**
   * Atualiza data/hora da prova
   * @param examId - ID da prova
   * @param data - Nova data e hora
   */
  async updateExamDate(examId: string, data: { scheduledDate: Date; scheduledTime: string }) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException('Prova não encontrada');
    }

    if (exam.status !== 'SCHEDULED') {
      throw new BadRequestException('Só é possível alterar data de provas com status SCHEDULED');
    }

    const updated = await this.prisma.exam.update({
      where: { id: examId },
      data: {
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
      },
      include: {
        enrollment: {
          include: {
            student: true,
          },
        },
        course: true,
        instructor: true,
      },
    });

    return updated;
  }

  /**
   * Atualiza todos os campos da prova (exceto examCode)
   * @param examId - ID da prova
   * @param data - Dados para atualizar
   */
  async updateExam(
    examId: string,
    data: Partial<{
      examNumber: string;
      examType: string;
      scheduledDate: Date;
      scheduledTime: string;
      duration: number;
      notes: string;
      instructorId: string;
    }>,
  ) {
    // Usar transação para evitar race condition
    return await this.prisma.$transaction(async (prisma) => {
      // Buscar dados atuais apenas para validações
      const exam = await prisma.exam.findUnique({
        where: { id: examId },
        select: { id: true, status: true, instructorId: true, scheduledDate: true },
      });

      if (!exam) {
        throw new NotFoundException('Prova não encontrada');
      }

      if (exam.status !== 'SCHEDULED') {
        throw new BadRequestException('Só é possível editar provas com status SCHEDULED');
      }

      // Validar dados de entrada
      if (data.duration !== undefined && data.duration <= 0) {
        throw new BadRequestException('Duração deve ser positiva');
      }

      if (data.scheduledDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const schedDate = new Date(data.scheduledDate);
        schedDate.setHours(0, 0, 0, 0);

        if (schedDate < today) {
          throw new BadRequestException('Data agendada não pode ser no passado');
        }
      }

      // Validar instrutor apenas se fornecido e diferente do atual
      if (data.instructorId && data.instructorId !== exam.instructorId) {
        const instructor = await prisma.instructor.findUnique({
          where: { id: data.instructorId },
          select: { id: true, isActive: true },
        });

        if (!instructor || !instructor.isActive) {
          throw new BadRequestException('Instrutor inválido ou inativo');
        }
      }

      // Construir objeto de atualização (examCode é explicitamente excluído)
      const updateData: Prisma.ExamUpdateInput = {};

      if (data.examNumber !== undefined) updateData.examNumber = data.examNumber;
      if (data.examType !== undefined) updateData.examType = data.examType;
      if (data.scheduledDate !== undefined) updateData.scheduledDate = data.scheduledDate;
      if (data.scheduledTime !== undefined) updateData.scheduledTime = data.scheduledTime;
      if (data.duration !== undefined) updateData.duration = data.duration;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.instructorId !== undefined) {
        updateData.instructor = {
          connect: { id: data.instructorId },
        };
      }

      // Update com condição atômica para evitar TOCTOU
      const updated = await prisma.exam.updateMany({
        where: {
          id: examId,
          status: 'SCHEDULED', // Condição atômica
        },
        data: updateData,
      });

      if (updated.count === 0) {
        throw new BadRequestException('Prova não pode ser atualizada (status alterado)');
      }

      // Buscar resultado completo
      return await prisma.exam.findUnique({
        where: { id: examId },
        include: {
          enrollment: {
            include: {
              student: true,
            },
          },
          course: true,
          instructor: true,
        },
      });
    });
  }

  /**
   * Cancela uma prova
   * @param examId - ID da prova
   */
  async cancelExam(examId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException('Prova não encontrada');
    }

    if (exam.status === 'COMPLETED' || exam.status === 'APPROVED') {
      throw new BadRequestException('Não é possível cancelar uma prova já finalizada');
    }

    const updated = await this.prisma.exam.update({
      where: { id: examId },
      data: {
        status: 'CANCELLED',
      },
    });

    return updated;
  }
}
