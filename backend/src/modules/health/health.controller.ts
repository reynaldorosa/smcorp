import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '@/prisma/prisma.service';

interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
}

interface DbHealthResponse extends HealthResponse {
  database: {
    status: 'connected' | 'disconnected';
    responseTime?: number;
  };
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Health check básico' })
  @ApiResponse({ status: 200, description: 'Serviço está funcionando' })
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    };
  }

  @Get('db')
  @ApiOperation({ summary: 'Health check com verificação do banco' })
  @ApiResponse({ status: 200, description: 'Serviço e banco estão funcionando' })
  @ApiResponse({ status: 503, description: 'Banco de dados não está acessível' })
  async getDbHealth(): Promise<DbHealthResponse> {
    const startTime = Date.now();
    const isDbHealthy = await this.prisma.healthCheck();
    const responseTime = Date.now() - startTime;

    return {
      status: isDbHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database: {
        status: isDbHealthy ? 'connected' : 'disconnected',
        responseTime,
      },
    };
  }
}
