import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StudentDocumentsService } from './student-documents.service';
import {
  UploadDocumentDto,
  ValidateDocumentDto,
  RejectDocumentDto,
  GetStudentDocumentsDto,
  SendPendingDocumentsNotificationDto,
  UploadDocumentSchema,
  ValidateDocumentSchema,
  RejectDocumentSchema,
  SendPendingDocumentsNotificationSchema,
} from './dto/student-document.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('student-documents')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('student-documents')
export class StudentDocumentsController {
  constructor(private readonly studentDocumentsService: StudentDocumentsService) {}

  // As duas rotas GET (status/lista) são compartilhadas com CLIENT_PJ
  // (isento de gating por módulo — ver PermissionsGuard) e ficam só atrás de
  // @Roles. As mutações (upload/validar/rejeitar/excluir/notificar) são
  // exclusivas de Validação de Documentos (modulo06).
  /**
   * POST /student-documents/upload
   * Faz upload de documento do aluno
   */
  @Post('upload')
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo06')
  @HttpCode(HttpStatus.CREATED)
  async uploadDocument(
    @Body(new ZodValidationPipe(UploadDocumentSchema))
    body: UploadDocumentDto,
  ) {
    return this.studentDocumentsService.uploadDocument(body);
  }

  /**
   * POST /student-documents/:id/validate
   * Valida/Aprova documento
   */
  @Post(':id/validate')
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo06')
  @HttpCode(HttpStatus.OK)
  async validateDocument(
    @Param('id') documentId: string,
    @Body(new ZodValidationPipe(ValidateDocumentSchema))
    body: Omit<ValidateDocumentDto, 'documentId'>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.studentDocumentsService.validateDocument({
      documentId,
      ...body,
      validatorId: user.sub,
    });
  }

  /**
   * POST /student-documents/:id/reject
   * Rejeita documento com motivo
   */
  @Post(':id/reject')
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo06')
  @HttpCode(HttpStatus.OK)
  async rejectDocument(
    @Param('id') documentId: string,
    @Body(new ZodValidationPipe(RejectDocumentSchema))
    body: Omit<RejectDocumentDto, 'documentId'>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.studentDocumentsService.rejectDocument({
      documentId,
      ...body,
      validatorId: user.sub,
    });
  }

  /**
   * GET /student-documents/student/:studentId/status
   * Verifica se todos os documentos obrigatórios estão completos
   */
  @Get('student/:studentId/status')
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER', 'CLIENT_PJ')
  async checkAllDocumentsComplete(
    @Param('studentId') studentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const companyScopeId = user.role === 'CLIENT_PJ' ? user.companyId : undefined;
    return this.studentDocumentsService.checkAllDocumentsComplete(
      {
        studentId,
      },
      companyScopeId,
    );
  }

  /**
   * GET /student-documents/student/:studentId
   * Lista documentos do aluno com filtros opcionais
   */
  @Get('student/:studentId')
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER', 'CLIENT_PJ')
  async getStudentDocuments(
    @Param('studentId') studentId: string,
    @CurrentUser() user: JwtPayload,
    @Query('documentType') documentType?: string,
    @Query('status') status?: 'PENDING' | 'COMPLETE' | 'REJECTED',
  ) {
    const companyScopeId = user.role === 'CLIENT_PJ' ? user.companyId : undefined;
    return this.studentDocumentsService.getStudentDocuments(
      {
        studentId,
        documentType: documentType as GetStudentDocumentsDto['documentType'],
        status,
      },
      companyScopeId,
    );
  }

  /**
   * DELETE /student-documents/:id
   * Deleta documento (soft delete)
   */
  @Delete(':id')
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo06')
  @HttpCode(HttpStatus.OK)
  async deleteDocument(@Param('id') documentId: string) {
    return this.studentDocumentsService.deleteDocument(documentId);
  }

  /**
   * POST /student-documents/:id/notify-pending
   * Registra e prepara envio de notificação de documentos pendentes
   */
  @Post(':id/notify-pending')
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo06')
  @HttpCode(HttpStatus.OK)
  async notifyPendingDocuments(
    @Param('id') documentId: string,
    @Body(new ZodValidationPipe(SendPendingDocumentsNotificationSchema))
    body: SendPendingDocumentsNotificationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.studentDocumentsService.sendPendingDocumentsNotification({
      documentId,
      ...body,
      senderId: user.sub,
    });
  }
}
