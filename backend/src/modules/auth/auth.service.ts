import {
  Injectable,
  UnauthorizedException,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { PortalPjLoginDto } from './dto/portal-pj-login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

export interface PortalPjProfileResponse {
  id: string;
  name: string;
  tradeName: string | null;
  companyTaxId: string;
  email: string | null;
  phone: string | null;
  code: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly portalPjFailures = new Map<
    string,
    { attempts: number; lockUntil?: number; lastFailureAt: number }
  >();
  private readonly masterPinFailures = new Map<
    string,
    { attempts: number; lockUntil?: number; lastFailureAt: number }
  >();
  private readonly portalPjLockBaseSeconds = 30;
  private readonly portalPjLockMaxSeconds = 15 * 60;
  private readonly masterPinLockBaseSeconds = 30;
  private readonly masterPinLockMaxSeconds = 15 * 60;

  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private buildPortalPjFailureKey(login: string, clientIp?: string) {
    const safeLogin = login.trim().toLowerCase();
    const safeIp = (clientIp || 'unknown').trim();
    return `${safeLogin}|${safeIp}`;
  }

  private assertPortalPjNotLocked(key: string) {
    const now = Date.now();
    const state = this.portalPjFailures.get(key);

    if (!state?.lockUntil) {
      return;
    }

    if (state.lockUntil <= now) {
      this.portalPjFailures.delete(key);
      return;
    }

    const retryInSeconds = Math.ceil((state.lockUntil - now) / 1000);
    throw new HttpException(
      `Muitas tentativas de login. Tente novamente em ${retryInSeconds} segundo(s).`,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private registerPortalPjFailure(key: string) {
    const now = Date.now();
    const current = this.portalPjFailures.get(key);
    const attempts = (current?.attempts || 0) + 1;

    let lockUntil: number | undefined;
    if (attempts >= 3) {
      const exponent = Math.min(attempts - 3, 6);
      const lockSeconds = Math.min(
        this.portalPjLockBaseSeconds * Math.pow(2, exponent),
        this.portalPjLockMaxSeconds,
      );
      lockUntil = now + lockSeconds * 1000;
    }

    this.portalPjFailures.set(key, {
      attempts,
      lockUntil,
      lastFailureAt: now,
    });
  }

  private clearPortalPjFailures(key: string) {
    this.portalPjFailures.delete(key);
  }

  private buildMasterPinFailureKey(actorId: string, clientIp?: string) {
    const safeActor = actorId.trim().toLowerCase();
    const safeIp = (clientIp || 'unknown').trim();
    return `${safeActor}|${safeIp}`;
  }

  private assertMasterPinNotLocked(key: string) {
    const now = Date.now();
    const state = this.masterPinFailures.get(key);

    if (!state?.lockUntil) {
      return;
    }

    if (state.lockUntil <= now) {
      this.masterPinFailures.delete(key);
      return;
    }

    const retryInSeconds = Math.ceil((state.lockUntil - now) / 1000);
    throw new HttpException(
      `Muitas tentativas de PIN. Tente novamente em ${retryInSeconds} segundo(s).`,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private registerMasterPinFailure(key: string) {
    const now = Date.now();
    const current = this.masterPinFailures.get(key);
    const attempts = (current?.attempts || 0) + 1;

    let lockUntil: number | undefined;
    if (attempts >= 3) {
      const exponent = Math.min(attempts - 3, 6);
      const lockSeconds = Math.min(
        this.masterPinLockBaseSeconds * Math.pow(2, exponent),
        this.masterPinLockMaxSeconds,
      );
      lockUntil = now + lockSeconds * 1000;
    }

    this.masterPinFailures.set(key, {
      attempts,
      lockUntil,
      lastFailureAt: now,
    });
  }

  private clearMasterPinFailures(key: string) {
    this.masterPinFailures.delete(key);
  }

  async authorizeMasterPin(
    pin: string,
    actorId: string,
    clientIp?: string,
  ): Promise<{ authorized: boolean }> {
    const normalizedPin = pin.trim();
    const failureKey = this.buildMasterPinFailureKey(actorId, clientIp);

    this.assertMasterPinNotLocked(failureKey);

    const masterUsers = await this.prisma.user.findMany({
      where: {
        role: 'MASTER',
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        masterPinHash: true,
        password: true,
      },
      take: 20,
    });

    if (masterUsers.length === 0) {
      this.registerMasterPinFailure(failureKey);
      throw new UnauthorizedException('Nenhum usuário master ativo encontrado');
    }

    for (const master of masterUsers) {
      const pinHash = master.masterPinHash || master.password;
      const isValid = await bcrypt.compare(normalizedPin, pinHash);
      if (isValid) {
        this.clearMasterPinFailures(failureKey);
        return { authorized: true };
      }
    }

    this.registerMasterPinFailure(failureKey);
    throw new UnauthorizedException('PIN Master inválido');
  }

  async loginPortalPj(loginDto: PortalPjLoginDto, clientIp?: string): Promise<AuthResponseDto> {
    const normalizedLogin = loginDto.login.trim().toLowerCase();
    const failureKey = this.buildPortalPjFailureKey(normalizedLogin, clientIp);

    this.assertPortalPjNotLocked(failureKey);

    const companies = await this.prisma.company.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        cnpj: true,
        tenantId: true,
        settings: {
          select: {
            settings: true,
          },
        },
      },
    });

    let matchedCompany: {
      id: string;
      name: string;
      email: string | null;
      cnpj: string;
      tenantId?: string;
    } | null = null;
    let passwordHash: string | null = null;

    for (const company of companies) {
      const rawSettings = company.settings?.settings;
      const settingsObj =
        rawSettings && typeof rawSettings === 'object' && !Array.isArray(rawSettings)
          ? (rawSettings as Record<string, unknown>)
          : null;

      const portalRaw = settingsObj?.portal;
      const portalSettings =
        portalRaw && typeof portalRaw === 'object' && !Array.isArray(portalRaw)
          ? (portalRaw as Record<string, unknown>)
          : null;

      const portalAccess = portalSettings?.access === true;
      const portalLogin =
        typeof portalSettings?.login === 'string' ? portalSettings.login.trim().toLowerCase() : '';
      const portalPasswordHash =
        typeof portalSettings?.passwordHash === 'string' ? portalSettings.passwordHash : '';

      if (!portalAccess || !portalLogin || !portalPasswordHash) {
        continue;
      }

      if (portalLogin !== normalizedLogin) {
        continue;
      }

      matchedCompany = {
        id: company.id,
        name: company.name,
        email: company.email,
        cnpj: company.cnpj,
        tenantId: company.tenantId || undefined,
      };
      passwordHash = portalPasswordHash;
      break;
    }

    if (!matchedCompany || !passwordHash) {
      this.registerPortalPjFailure(failureKey);
      this.logger.warn(`Portal PJ login inválido para login: ${normalizedLogin}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, passwordHash);
    if (!isPasswordValid) {
      this.registerPortalPjFailure(failureKey);
      this.logger.warn(`Portal PJ senha inválida para login: ${normalizedLogin}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    this.clearPortalPjFailures(failureKey);

    const accessToken = await this.jwtService.signAsync(
      {
        sub: matchedCompany.id,
        email: matchedCompany.email || `${normalizedLogin}@client-pj.local`,
        role: 'CLIENT_PJ',
        companyId: matchedCompany.id,
        tenantId: matchedCompany.tenantId,
      },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '15m',
      },
    );

    this.logger.log(`Portal PJ login bem-sucedido para empresa: ${matchedCompany.id}`);

    return {
      accessToken,
      refreshToken: '',
      user: {
        id: matchedCompany.id,
        email: matchedCompany.email || normalizedLogin,
        name: matchedCompany.name,
        role: 'CLIENT_PJ',
      },
    };
  }

  async getPortalPjProfile(user: JwtPayload): Promise<PortalPjProfileResponse> {
    if (user.role !== 'CLIENT_PJ') {
      throw new UnauthorizedException('Acesso restrito ao portal PJ');
    }

    const companyId = user.companyId || user.sub;
    const company = await this.prisma.company.findFirst({
      where: {
        id: companyId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        tradeName: true,
        cnpj: true,
        email: true,
        phone: true,
      },
    });

    if (!company) {
      throw new UnauthorizedException('Empresa não encontrada ou inativa');
    }

    const cnpjDigits = (company.cnpj || '').replace(/\D/g, '');
    const code = `PJ-${cnpjDigits.slice(-4).padStart(4, '0')}`;

    return {
      id: company.id,
      name: company.name,
      tradeName: company.tradeName,
      companyTaxId: company.cnpj,
      email: company.email,
      phone: company.phone,
      code,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;
    const normalizedEmail = email.trim().toLowerCase();

    // Find user by email
    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user) {
      this.logger.warn(`Failed login attempt for email: ${normalizedEmail}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Check if user is active
    if (!user.isActive) {
      this.logger.warn(`Login attempt for inactive user: ${normalizedEmail}`);
      throw new UnauthorizedException('Usuário inativo');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for user: ${normalizedEmail}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Generate tokens
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId || undefined,
    });

    // Update refresh token in database
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    this.logger.log(`User logged in successfully: ${normalizedEmail}`);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId || undefined,
      },
    };
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<AuthResponseDto> {
    const user = await this.usersService.findById(userId);

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Acesso negado');
    }

    // Verify refresh token matches
    const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Acesso negado');
    }

    // Generate new tokens
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId || undefined,
    });

    // Update refresh token
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId || undefined,
      },
    };
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
    this.logger.log(`User logged out: ${userId}`);
  }

  private async generateTokens(
    payload: JwtPayload,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
