import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security middleware
  app.use(helmet());

  // CORS — aceita múltiplas origens separadas por vírgula (SaaS multi-domínio)
  const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // API prefix
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'health/db'],
  });

  // Swagger documentation — nunca exposto em produção por padrão (superfície
  // de info-disclosure: schema completo da API, DTOs, rotas). Habilite
  // explicitamente via ENABLE_SWAGGER=true se precisar em produção.
  const swaggerEnabled =
    process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true';

  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('SMCORP API')
      .setDescription('API do Sistema de Gestão de Treinamentos SMCORP')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('auth', 'Autenticação')
      .addTag('users', 'Gerenciamento de usuários')
      .addTag('dashboard', 'Dashboard executivo')
      .addTag('health', 'Health check')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Start server
  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`
  ╔════════════════════════════════════════════════════════════╗
  ║                                                            ║
  ║   🚀 SMCORP Backend is running!                            ║
  ║                                                            ║
  ║   📡 API:     http://localhost:${port}/api/v1                ║
  ${swaggerEnabled ? `║   📚 Swagger: http://localhost:${port}/api/docs              ║\n  ` : ''}║   💚 Health:  http://localhost:${port}/health                ║
  ║                                                            ║
  ╚════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
