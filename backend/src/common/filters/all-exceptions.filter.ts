import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { TenantContextService } from '../services/tenant-context.service';

/**
 * Filtro global de exceções com LOGGING de contexto.
 *
 * Sem este filtro, o Nest responde 500/400 mas NÃO loga a causa raiz —
 * em produção é impossível descobrir por que uma rota quebrou olhando só
 * os logs (o que motivou este filtro: "não consigo ver os logs").
 *
 * Comportamento:
 * - Erros 5xx: loga `error` com stack completo + tenantId + rota + userId.
 * - Erros 4xx (validação/autorização): loga `warn` curto (sem stack, sem ruído).
 * - A resposta HTTP mantém o formato padrão do Nest (statusCode/message/error).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly tenantContext: TenantContextService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const { tenantId } = this.tenantContext.get();
    const userId = (request.user as { sub?: string } | undefined)?.sub;
    const route = `${request.method} ${request.url}`;
    const context = `route=${route} tenantId=${tenantId || 'plataforma'} userId=${userId || '-'}`;

    if (status >= 500) {
      const message = exception instanceof Error ? exception.message : 'Erro interno desconhecido';
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(`${context} -> ${status} ${message}`, stack);
    } else {
      const message =
        exception instanceof HttpException
          ? (exception.getResponse() as { message?: string | string[] }).message
          : undefined;
      this.logger.warn(`${context} -> ${status} ${JSON.stringify(message)}`);
    }

    const body =
      exception instanceof HttpException
        ? exception.getResponse()
        : {
            statusCode: status,
            message: 'Erro interno do servidor',
            error: 'Internal Server Error',
          };

    response.status(status).json(body);
  }
}
