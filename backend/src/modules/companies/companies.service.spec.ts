import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesService } from './companies.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CompaniesService', () => {
  let service: CompaniesService;

  const mockPrismaService = {
    company: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    companySettings: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    student: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompaniesService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStudents', () => {
    it('lista alunos da empresa com paginação', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({
        id: 'company-1',
        cnpj: '12345678000199',
        deletedAt: null,
      });
      mockPrismaService.student.findMany.mockResolvedValue([
        { id: 's1', name: 'Aluno A', code: 'A0001' },
        { id: 's2', name: 'Aluno B', code: 'A0002' },
      ]);
      mockPrismaService.student.count.mockResolvedValue(2);

      const result = await service.getStudents('company-1', 1, 20);

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.pages).toBe(1);
      expect(mockPrismaService.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { companyId: 'company-1', deletedAt: null },
          skip: 0,
          take: 20,
        }),
      );
    });

    it('lança NotFoundException quando a empresa não existe', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue(null);

      await expect(service.getStudents('inexistente')).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.student.findMany).not.toHaveBeenCalled();
    });
  });
});
