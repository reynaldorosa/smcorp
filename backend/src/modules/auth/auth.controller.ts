import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Get, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import type { PortalPjProfileResponse } from './auth.service';
import { LoginDto, LoginSchema } from './dto/login.dto';
import { PortalPjLoginDto, PortalPjLoginSchema } from './dto/portal-pj-login.dto';
import {
  MasterPinAuthorizationDto,
  MasterPinAuthorizationSchema,
} from './dto/master-pin-authorization.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { RolesGuard } from './guards/roles.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { Public } from './decorators/public.decorator';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * IP real do cliente, usado como chave dos bloqueios de força bruta
   * (portal PJ / PIN master) e no log de auditoria.
   *
   * NÃO usa o primeiro valor de X-Forwarded-For: o nginx da borda grava esse
   * header com `$proxy_add_x_forwarded_for`, que só ANEXA ao que veio do
   * cliente — o primeiro valor pode ser forjado pelo próprio requisitante
   * (`X-Forwarded-For: 1.2.3.4`), o que bypassa o bloqueio de tentativas.
   * `X-Real-IP` é `$remote_addr` setado pelo nginx e sobrescreve qualquer
   * valor que o cliente tente enviar nesse header — não é spoofável aqui.
   */
  private extractClientIp(request: Request): string | undefined {
    const realIp = request.headers['x-real-ip'];
    if (typeof realIp === 'string' && realIp.trim()) {
      return realIp.trim();
    }
    return request.ip;
  }

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({
    short: { limit: 5, ttl: 60_000 },
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(
    @Body(new ZodValidationPipe(LoginSchema)) loginDto: LoginDto,
  ): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('portal-pj/login')
  @UseGuards(ThrottlerGuard)
  @Throttle({
    short: { limit: 5, ttl: 60_000 },
  })
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login do portal cliente PJ' })
  @ApiResponse({
    status: 200,
    description: 'Login do portal PJ realizado com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async portalPjLogin(
    @Body(new ZodValidationPipe(PortalPjLoginSchema))
    loginDto: PortalPjLoginDto,
    @Req() request: Request,
  ): Promise<AuthResponseDto> {
    return this.authService.loginPortalPj(loginDto, this.extractClientIp(request));
  }

  @Post('master-pin/authorize')
  @UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER')
  @Throttle({
    short: { limit: 5, ttl: 60_000 },
  })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Autoriza ação sensível com PIN master' })
  @ApiResponse({ status: 200, description: 'PIN válido' })
  @ApiResponse({ status: 401, description: 'PIN inválido' })
  async authorizeMasterPin(
    @Body(new ZodValidationPipe(MasterPinAuthorizationSchema))
    body: MasterPinAuthorizationDto,
    @CurrentUser() user: JwtPayload,
    @Req() request: Request,
  ): Promise<{ authorized: boolean }> {
    return this.authService.authorizeMasterPin(body.pin, user.sub, this.extractClientIp(request));
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Renovar tokens' })
  @ApiResponse({
    status: 200,
    description: 'Tokens renovados com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Token inválido' })
  async refreshTokens(
    @CurrentUser() user: JwtPayload & { refreshToken: string },
  ): Promise<AuthResponseDto> {
    return this.authService.refreshTokens(user.sub, user.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout do usuário' })
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso' })
  async logout(@CurrentUser() user: JwtPayload): Promise<{ message: string }> {
    await this.authService.logout(user.sub);
    return { message: 'Logout realizado com sucesso' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obter usuário atual' })
  @ApiResponse({ status: 200, description: 'Dados do usuário' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async getMe(@CurrentUser() user: JwtPayload): Promise<JwtPayload> {
    return user;
  }

  @Get('portal-pj/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CLIENT_PJ')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obter perfil da empresa autenticada no portal PJ' })
  @ApiResponse({ status: 200, description: 'Perfil do portal PJ' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async getPortalPjProfile(@CurrentUser() user: JwtPayload): Promise<PortalPjProfileResponse> {
    return this.authService.getPortalPjProfile(user);
  }
}
