import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ClassesService', () => {
  let service: ClassesService;

  const mockPrismaService = {
    class: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
    },
    room: {
      findUnique: jest.fn(),
    },
    instructor: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    enrollment: {
      count: jest.fn(),
    },
    classInstructor: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    instructorAttendance: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ClassesService>(ClassesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================
  // M03 — instrutores da turma e presença
  // ============================================

  describe('instrutores da turma', () => {
    it('devolve a presença persistida, não uma lista vazia fixa', async () => {
      // Regressão: o service devolvia `attendances: []` hardcoded, então a
      // presença confirmada na UI nunca voltava do backend.
      mockPrismaService.classInstructor.findMany.mockResolvedValue([
        {
          classId: 'turma-1',
          instructorId: 'instrutor-1',
          attendances: [
            {
              date: new Date('2026-08-04T00:00:00.000Z'),
              confirmedAt: new Date('2026-08-04T13:30:00.000Z'),
              confirmedBy: 'user-1',
            },
          ],
        },
      ]);
      mockPrismaService.class.findUnique.mockResolvedValue({
        id: 'turma-1',
        instructorId: null,
        enrollments: [],
      });

      const result = (await service.findOne('turma-1')) as unknown as {
        instructors: Array<{ instructorId: string; attendances: Array<{ date: string }> }>;
      };

      expect(result.instructors).toHaveLength(1);
      expect(result.instructors[0].attendances).toEqual([
        {
          date: '2026-08-04',
          confirmedAt: '2026-08-04T13:30:00.000Z',
          confirmedBy: 'user-1',
        },
      ]);
    });

    it('inclui o instrutor principal legado mesmo sem vínculo N:N', async () => {
      mockPrismaService.classInstructor.findMany.mockResolvedValue([]);
      mockPrismaService.class.findUnique.mockResolvedValue({
        id: 'turma-1',
        instructorId: 'instrutor-legado',
        enrollments: [],
      });

      const result = (await service.findOne('turma-1')) as unknown as {
        instructors: Array<{ instructorId: string; attendances: unknown[] }>;
      };

      expect(result.instructors).toEqual([{ instructorId: 'instrutor-legado', attendances: [] }]);
    });

    it('não duplica o instrutor principal quando ele já tem vínculo N:N', async () => {
      mockPrismaService.classInstructor.findMany.mockResolvedValue([
        { classId: 'turma-1', instructorId: 'instrutor-1', attendances: [] },
      ]);
      mockPrismaService.class.findUnique.mockResolvedValue({
        id: 'turma-1',
        instructorId: 'instrutor-1',
        enrollments: [],
      });

      const result = (await service.findOne('turma-1')) as unknown as {
        instructors: unknown[];
      };

      expect(result.instructors).toHaveLength(1);
    });
  });

  describe('confirmInstructorAttendance', () => {
    beforeEach(() => {
      mockPrismaService.classInstructor.findMany.mockResolvedValue([]);
      mockPrismaService.class.findUnique.mockResolvedValue({
        id: 'turma-1',
        instructorId: null,
        enrollments: [],
      });
    });

    it('persiste a presença do dia para um vínculo existente', async () => {
      mockPrismaService.classInstructor.findFirst.mockResolvedValue({ id: 'vinculo-1' });
      mockPrismaService.instructorAttendance.findFirst.mockResolvedValue(null);

      await service.confirmInstructorAttendance('turma-1', 'instrutor-1', '2026-08-04', 'user-1');

      expect(mockPrismaService.instructorAttendance.create).toHaveBeenCalledWith({
        data: {
          classInstructorId: 'vinculo-1',
          date: new Date('2026-08-04T00:00:00.000Z'),
          confirmedBy: 'user-1',
        },
      });
    });

    it('é idempotente: confirmar o mesmo dia duas vezes não duplica', async () => {
      mockPrismaService.classInstructor.findFirst.mockResolvedValue({ id: 'vinculo-1' });
      mockPrismaService.instructorAttendance.findFirst.mockResolvedValue({
        id: 'presenca-1',
      });

      await service.confirmInstructorAttendance('turma-1', 'instrutor-1', '2026-08-04', 'user-2');

      expect(mockPrismaService.instructorAttendance.create).not.toHaveBeenCalled();
      expect(mockPrismaService.instructorAttendance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'presenca-1' },
          data: expect.objectContaining({ deletedAt: null, confirmedBy: 'user-2' }),
        }),
      );
    });

    it('cria o vínculo sob demanda para o instrutor principal legado', async () => {
      mockPrismaService.classInstructor.findFirst.mockResolvedValue(null);
      mockPrismaService.class.findFirst.mockResolvedValue({
        id: 'turma-1',
        instructorId: 'instrutor-legado',
      });
      mockPrismaService.classInstructor.create.mockResolvedValue({ id: 'vinculo-novo' });
      mockPrismaService.instructorAttendance.findFirst.mockResolvedValue(null);

      await service.confirmInstructorAttendance(
        'turma-1',
        'instrutor-legado',
        '2026-08-04',
        'user-1',
      );

      expect(mockPrismaService.classInstructor.create).toHaveBeenCalledWith({
        data: { classId: 'turma-1', instructorId: 'instrutor-legado' },
      });
    });

    it('recusa instrutor que não pertence à turma', async () => {
      mockPrismaService.classInstructor.findFirst.mockResolvedValue(null);
      mockPrismaService.class.findFirst.mockResolvedValue({
        id: 'turma-1',
        instructorId: 'outro-instrutor',
      });

      await expect(
        service.confirmInstructorAttendance('turma-1', 'intruso', '2026-08-04', 'user-1'),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.classInstructor.create).not.toHaveBeenCalled();
    });
  });

  describe('syncClassInstructors (via update)', () => {
    it('propaga a falha em vez de engolir o erro silenciosamente', async () => {
      // Regressão: o SQL cru ficava dentro de `catch {}` — se o vínculo falhasse,
      // a resposta saía como sucesso e os instrutores não eram gravados.
      mockPrismaService.class.findUnique.mockResolvedValue({
        id: 'turma-1',
        instructorId: null,
        startDate: new Date('2026-08-01'),
        endDate: new Date('2026-08-10'),
        roomId: null,
        courseId: 'curso-1',
        enrollments: [],
      });
      mockPrismaService.instructor.findMany.mockResolvedValue([
        { id: 'instrutor-1', isActive: true },
      ]);
      mockPrismaService.class.update.mockResolvedValue({ id: 'turma-1', instructorId: null });
      mockPrismaService.$transaction.mockRejectedValue(new Error('falha no vínculo'));

      await expect(service.update('turma-1', { instructorIds: ['instrutor-1'] })).rejects.toThrow(
        'falha no vínculo',
      );
    });
  });
});
