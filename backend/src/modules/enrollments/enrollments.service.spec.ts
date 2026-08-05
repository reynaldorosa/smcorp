import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentsService } from './enrollments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/services/tenant-context.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    enrollment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    studentDocument: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    student: {
      findUnique: jest.fn(),
    },
    class: {
      findUnique: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockTenantContext = {
    run: jest.fn(async (_data: unknown, fn: () => unknown) => fn()),
    get: jest.fn(() => ({})),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: TenantContextService,
          useValue: mockTenantContext,
        },
      ],
    }).compile();

    service = module.get<EnrollmentsService>(EnrollmentsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateEnrollmentToken', () => {
    it('deve gerar token de matrícula com sucesso', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        tokenUsedAt: null,
      };

      const updatedEnrollment = {
        id: 'enrollment-1',
        enrollmentToken: 'generated-token-123',
        tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        student: { name: 'João', email: 'joao@test.com' },
        class: {
          code: 'T001',
          course: { name: 'NR-35' },
        },
      };

      mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);
      mockPrismaService.enrollment.update.mockResolvedValue(updatedEnrollment);

      const result = await service.generateEnrollmentToken({
        enrollmentId: 'enrollment-1',
        expiresInHours: 24,
      });

      expect(result).toHaveProperty('enrollmentToken');
      expect(prisma.enrollment.update).toHaveBeenCalled();
    });

    it('deve lançar exceção se matrícula não encontrada', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue(null);

      await expect(
        service.generateEnrollmentToken({ enrollmentId: 'invalid', expiresInHours: 24 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar exceção se token já utilizado', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        tokenUsedAt: new Date(),
      };

      mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);

      const updatedEnrollment = {
        id: 'enrollment-1',
        enrollmentToken: 'generated-token-123',
        tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        student: { name: 'João', email: 'joao@test.com' },
        class: {
          code: 'T001',
          course: { name: 'NR-35' },
        },
      };

      mockPrismaService.enrollment.update.mockResolvedValue(updatedEnrollment);

      const result = await service.generateEnrollmentToken({
        enrollmentId: 'enrollment-1',
        expiresInHours: 24,
      });

      expect(result).toHaveProperty('enrollmentToken');
      expect(prisma.enrollment.update).toHaveBeenCalled();
    });
  });

  describe('validateToken', () => {
    it('deve validar token válido com sucesso', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        enrollmentToken: 'valid-token',
        tokenExpiresAt: new Date(Date.now() + 10000),
        tokenUsedAt: null,
        status: 'SCHEDULED',
        student: { id: 'student-1', name: 'João', documents: [] },
        class: {
          course: { requiredDocuments: ['RG', 'CPF'] },
        },
      };

      mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);

      const result = await service.validateToken({ token: 'valid-token' });

      expect(result).toBe(mockEnrollment);
      expect(prisma.enrollment.update).not.toHaveBeenCalled();
    });

    it('deve lançar exceção se token expirado', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        enrollmentToken: 'expired-token',
        tokenExpiresAt: new Date(Date.now() - 1000),
        tokenUsedAt: null,
      };

      mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);

      await expect(service.validateToken({ token: 'expired-token' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('requestDiscount', () => {
    it('deve solicitar desconto com sucesso', async () => {
      const mockEnrollment = { id: 'enrollment-1' };

      mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);
      mockPrismaService.enrollment.update.mockResolvedValue({ ...mockEnrollment, discount: 10 });

      await service.requestDiscount({
        enrollmentId: 'enrollment-1',
        discount: 10,
      });

      expect(prisma.enrollment.update).toHaveBeenCalled();
    });
  });

  describe('approveDiscount', () => {
    it('deve aprovar desconto com sucesso', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        discount: { toNumber: () => 10 }, // Decimal mock
      };
      const mockMaster = {
        id: 'master-1',
        role: 'MASTER',
        name: 'Master',
        email: 'master@test.com',
      };

      mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);
      mockPrismaService.user.findUnique.mockResolvedValue(mockMaster);
      mockPrismaService.enrollment.update.mockResolvedValue({
        ...mockEnrollment,
        discountApprovedAt: new Date(),
        discountApprovedBy: 'master-1',
        approvedBy: { name: 'Master', email: 'master@test.com' },
      });

      await service.approveDiscount({
        enrollmentId: 'enrollment-1',
        masterId: 'master-1',
      });

      expect(prisma.enrollment.update).toHaveBeenCalled();
    });
  });

  describe('uploadPublicDocumentByToken', () => {
    it('deve enviar documento público com token válido', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue({
        id: 'enrollment-1',
        studentId: 'student-1',
        tokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      const file = {
        mimetype: 'application/pdf',
        originalname: 'rg.pdf',
        size: 1200,
        buffer: Buffer.from('file-content'),
      };

      mockPrismaService.studentDocument.create.mockResolvedValue({
        id: 'doc-1',
        studentId: 'student-1',
        documentType: 'RG',
        status: 'PENDING',
      });

      const result = await service.uploadPublicDocumentByToken({
        token: 'valid-token',
        documentType: 'RG',
        file,
      });

      expect(result).toHaveProperty('id', 'doc-1');
      expect(prisma.studentDocument.create).toHaveBeenCalled();
    });

    it('deve falhar quando não há arquivo', async () => {
      await expect(
        service.uploadPublicDocumentByToken({
          token: 'valid-token',
          documentType: 'RG',
          file: null,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve falhar quando token for inválido', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue(null);

      await expect(
        service.uploadPublicDocumentByToken({
          token: 'invalid-token',
          documentType: 'RG',
          file: {
            mimetype: 'application/pdf',
            originalname: 'rg.pdf',
            size: 1200,
            buffer: Buffer.from('file-content'),
          },
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deletePublicDocumentByToken', () => {
    it('deve remover documento pendente com token válido', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue({
        id: 'enrollment-1',
        studentId: 'student-1',
        tokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      mockPrismaService.studentDocument.findFirst.mockResolvedValue({
        id: 'doc-1',
        status: 'PENDING',
      });

      mockPrismaService.studentDocument.update.mockResolvedValue({
        id: 'doc-1',
        deletedAt: new Date(),
      });

      const result = await service.deletePublicDocumentByToken({
        token: 'valid-token',
        documentId: 'doc-1',
      });

      expect(result).toEqual({
        success: true,
        message: 'Documento removido com sucesso',
        documentId: 'doc-1',
      });
      expect(prisma.studentDocument.update).toHaveBeenCalled();
    });

    it('deve bloquear remoção de documento aprovado', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue({
        id: 'enrollment-1',
        studentId: 'student-1',
        tokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      mockPrismaService.studentDocument.findFirst.mockResolvedValue({
        id: 'doc-1',
        status: 'COMPLETE',
      });

      await expect(
        service.deletePublicDocumentByToken({
          token: 'valid-token',
          documentId: 'doc-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve falhar quando documento não pertencer ao token/aluno', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue({
        id: 'enrollment-1',
        studentId: 'student-1',
        tokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      mockPrismaService.studentDocument.findFirst.mockResolvedValue(null);

      await expect(
        service.deletePublicDocumentByToken({
          token: 'valid-token',
          documentId: 'doc-x',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
