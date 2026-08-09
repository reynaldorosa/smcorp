import { Test, TestingModule } from '@nestjs/testing';
import { StudentDocumentsService } from './student-documents.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CommunicationService } from '../communication/communication.service';
import { TenantContextService } from '../../common/services/tenant-context.service';
import { TenantRlsService } from '../../common/services/tenant-rls.service';

describe('StudentDocumentsService (RLS piloto)', () => {
  let service: StudentDocumentsService;

  const mockPrismaService = {
    student: {
      findUnique: jest.fn(),
    },
    studentDocument: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    enrollment: {
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    companySettings: {
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  const mockTenantContextService = {
    get: jest.fn(() => ({})), // padrão: sem tenantId (MASTER/plataforma)
  };

  const mockTenantRlsService = {
    withTenantRls: jest.fn((fn: (client: unknown) => unknown) => fn(mockPrismaService)),
  };

  const mockCommunicationService = {
    send: jest.fn().mockResolvedValue({ sent: true, channel: 'email', provider: 'mock' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentDocumentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CommunicationService, useValue: mockCommunicationService },
        { provide: TenantContextService, useValue: mockTenantContextService },
        { provide: TenantRlsService, useValue: mockTenantRlsService },
      ],
    }).compile();

    service = module.get<StudentDocumentsService>(StudentDocumentsService);
  });

  it('sem tenantId no contexto: usa o Prisma direto, sem transação RLS', async () => {
    mockPrismaService.student.findUnique.mockResolvedValue({ id: 's1', companyId: null });
    mockPrismaService.studentDocument.findMany.mockResolvedValue([]);

    const result = await service.getStudentDocuments({ studentId: 's1' });

    expect(mockTenantRlsService.withTenantRls).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('com tenantId no contexto: consultas passam pelo TenantRlsService (RLS)', async () => {
    (mockTenantContextService.get as jest.Mock).mockReturnValue({ tenantId: 't1' });
    mockPrismaService.student.findUnique.mockResolvedValue({ id: 's1', companyId: null });
    mockPrismaService.studentDocument.findMany.mockResolvedValue([{ id: 'doc-1' }]);

    const result = await service.getStudentDocuments({ studentId: 's1' });

    expect(mockTenantRlsService.withTenantRls).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });

  it('uploadDocument rejeita documento duplicado (PENDING/COMPLETE do mesmo tipo)', async () => {
    (mockTenantContextService.get as jest.Mock).mockReturnValue({ tenantId: 't1' });
    mockPrismaService.student.findUnique.mockResolvedValue({ id: 's1', companyId: null });
    mockPrismaService.studentDocument.findFirst.mockResolvedValue({ id: 'doc-x' });

    await expect(
      service.uploadDocument({
        studentId: 's1',
        documentType: 'RG',
        fileUrl: 'data:image/png;base64,xxx',
      }),
    ).rejects.toThrow('Já existe um documento do tipo RG');
  });
});
