import { Test, TestingModule } from '@nestjs/testing';
import { ExamsService } from './exams.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ExamsService', () => {
  let service: ExamsService;

  const mockPrismaService = {
    exam: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    enrollment: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    instructor: {
      findUnique: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ExamsService>(ExamsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // TODO: Implementar testes completos após refatoração
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
