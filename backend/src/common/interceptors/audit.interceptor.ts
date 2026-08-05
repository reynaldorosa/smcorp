import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../services/audit.service';
import { Reflector } from '@nestjs/core';

export interface AuditLogMetadata {
  tableName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  getRecordId?: (result: unknown) => string | undefined;
  getOldData?: (context: ExecutionContext) => unknown;
  getNewData?: (result: unknown) => unknown;
}

export const AuditLog = (metadata: AuditLogMetadata) => Reflect.metadata('audit_log', metadata);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private auditService: AuditService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const metadata = this.reflector.get<AuditLogMetadata>('audit_log', context.getHandler());

    if (!metadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    // O JwtPayload usa `sub` (não `id`) para o id do usuário — é o mesmo
    // contrato usado em toda a auth (auth.controller, tenants, etc.).
    // `request.user?.id` sempre era `undefined`: todo log de auditoria
    // registrava o autor como nulo, quebrando a trilha que o próprio
    // audit.service.ts documenta como requisito regulatório.
    const userId = request.user?.sub;
    const ipAddress = request.ip;
    const userAgent = request.headers['user-agent'];

    return next.handle().pipe(
      tap(async (result: unknown) => {
        try {
          const recordId = metadata.getRecordId
            ? metadata.getRecordId(result)
            : (result as { id?: string })?.id;

          if (!recordId) {
            return;
          }

          const oldData = metadata.getOldData ? metadata.getOldData(context) : undefined;
          const newData = metadata.getNewData ? metadata.getNewData(result) : result;

          await this.auditService.log({
            tableName: metadata.tableName,
            recordId,
            action: metadata.action,
            userId,
            oldData,
            newData,
            ipAddress,
            userAgent,
          });
        } catch (error) {
          // Não quebra a resposta da API, mas o erro precisa aparecer nos logs
          this.logger.error(
            `Falha ao registrar auditoria (${metadata.tableName}/${metadata.action})`,
            error instanceof Error ? error.stack : String(error),
          );
        }
      }),
    );
  }
}
