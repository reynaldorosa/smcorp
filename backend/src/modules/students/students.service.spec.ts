import { Test, TestingModule } from '@nestjs/testing';
import { StudentsService } from './students.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/services/tenant-context.service';
import { TenantRlsService } from '../../common/services/tenant-rls.service';

describe('StudentsService (RLS piloto)', () => {
  let service: StudentsService;

  const mockPrismaService = {
    student: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockTenantContextService = {
    get: jest.fn(() => ({})), // padrão: sem tenantId (MASTER/plataforma)
  };

  const mockTenantRlsService = {
    withTenantRls: jest.fn((fn: (client: unknown) => unknown) => fn(mockPrismaService)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TenantContextService, useValue: mockTenantContextService },
        { provide: TenantRlsService, useValue: mockTenantRlsService },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
  });

  it('sem tenantId no contexto (MASTER): usa o Prisma direto, sem transação RLS', async () => {
    mockPrismaService.student.findMany.mockResolvedValue([]);
    mockPrismaService.student.count.mockResolvedValue(0);

    const result = await service.findAll(1, 20);

    expect(mockTenantRlsService.withTenantRls).not.toHaveBeenCalled();
    expect(result.meta.total).toBe(0);
    expect(mockPrismaService.student.findMany).toHaveBeenCalled();
  });

  it('com tenantId no contexto: passa pelo TenantRlsService (transação com RLS)', async () => {
    (mockTenantContextService.get as jest.Mock).mockReturnValue({ tenantId: 't1' });
    mockPrismaService.student.findMany.mockResolvedValue([{ id: 's1', name: 'Aluno A' }]);
    mockPrismaService.student.count.mockResolvedValue(1);

    const result = await service.findAll(1, 20);

    expect(mockTenantRlsService.withTenantRls).toHaveBeenCalledTimes(1);
    expect(result.data).toHaveLength(1);
  });

  it('findOne retorna 404 quando o aluno não existe (com RLS ativo)', async () => {
    (mockTenantContextService.get as jest.Mock).mockReturnValue({ tenantId: 't1' });
    mockPrismaService.student.findUnique.mockResolvedValue(null);

    await expect(service.findOne('x')).rejects.toThrow('Aluno não encontrado');
    expect(mockTenantRlsService.withTenantRls).toHaveBeenCalledTimes(1);
  });
});
