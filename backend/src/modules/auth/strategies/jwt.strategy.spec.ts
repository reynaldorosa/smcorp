import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../../prisma/prisma.service';
import { createDefaultPermissions } from '../permissions';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockPrisma = {
    user: { findFirst: jest.fn() },
    company: { findFirst: jest.fn() },
  };

  const mockConfig = { get: jest.fn(() => 'segredo-teste') };

  const basePayload = {
    sub: 'user-1',
    email: 'admin@escola.com.br',
    role: UserRole.ADMIN,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfig },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => jest.clearAllMocks());

  it('rejeita payload sem sub ou email', async () => {
    await expect(strategy.validate({ ...basePayload, sub: '' })).rejects.toThrow(
      UnauthorizedException,
    );
    expect(mockPrisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('revalida contra o banco e popula permissions para um usuário comum', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      isActive: true,
      role: UserRole.ADMIN,
      tenantId: 'tenant-1',
      permissions: null,
    });

    const result = await strategy.validate(basePayload);

    expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
      where: { id: 'user-1', deletedAt: null },
      select: { isActive: true, role: true, tenantId: true, permissions: true },
    });
    expect(result.isActive).toBe(true);
    expect(result.tenantId).toBe('tenant-1');
    expect(result.permissions).toEqual(createDefaultPermissions(UserRole.ADMIN));
  });

  it('rejeita usuário desativado — não confia no payload até o token expirar', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      isActive: false,
      role: UserRole.ADMIN,
      tenantId: 'tenant-1',
      permissions: null,
    });

    await expect(strategy.validate(basePayload)).rejects.toThrow(UnauthorizedException);
  });

  it('rejeita usuário que não existe mais (deletado)', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);
    await expect(strategy.validate(basePayload)).rejects.toThrow(UnauthorizedException);
  });

  it('CLIENT_PJ: sub é o Company.id (loginPortalPj), consulta company em vez de user', async () => {
    const pjPayload = { sub: 'company-1', email: 'contato@empresa.com', role: UserRole.CLIENT_PJ };
    mockPrisma.company.findFirst.mockResolvedValue({ isActive: true });

    const result = await strategy.validate(pjPayload);

    expect(mockPrisma.company.findFirst).toHaveBeenCalledWith({
      where: { id: 'company-1', deletedAt: null },
      select: { isActive: true },
    });
    expect(mockPrisma.user.findFirst).not.toHaveBeenCalled();
    // Portal PJ não é gated por módulo — payload passa sem permissions.
    expect(result).toEqual(pjPayload);
  });

  it('CLIENT_PJ: empresa inativa é rejeitada', async () => {
    const pjPayload = { sub: 'company-1', email: 'contato@empresa.com', role: UserRole.CLIENT_PJ };
    mockPrisma.company.findFirst.mockResolvedValue({ isActive: false });

    await expect(strategy.validate(pjPayload)).rejects.toThrow(UnauthorizedException);
  });
});
