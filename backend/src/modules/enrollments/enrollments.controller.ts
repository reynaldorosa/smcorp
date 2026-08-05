import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Delete,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import {
  AddEnrollmentExtraProductsBodyDto,
  AddEnrollmentExtraProductsSchema,
  CreateEnrollmentDto,
  CreateEnrollmentSchema,
  GenerateEnrollmentTokenDto,
  ValidateEnrollmentTokenDto,
  RequestDiscountDto,
  ApproveDiscountDto,
  UpdateEnrollmentStatusDto,
  GenerateEnrollmentTokenSchema,
  ValidateEnrollmentTokenSchema,
  RequestDiscountSchema,
  ApproveDiscountSchema,
  UpdateEnrollmentStatusSchema,
} from './dto/enrollment.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'COLLABORATOR', 'CLIENT_PJ')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(CreateEnrollmentSchema)) body: CreateEnrollmentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const companyScopeId = user.role === 'CLIENT_PJ' ? user.companyId : undefined;
    return this.enrollmentsService.createEnrollment(body, companyScopeId);
  }

  /**
   * POST /enrollments/:id/extra-products
   * Vincula produtos extras a matricula
   */
  @Post(':id/extra-products')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'COLLABORATOR')
  @HttpCode(HttpStatus.OK)
  async addExtraProducts(
    @Param('id') enrollmentId: string,
    @Body(new ZodValidationPipe(AddEnrollmentExtraProductsSchema))
    body: AddEnrollmentExtraProductsBodyDto,
  ) {
    return this.enrollmentsService.addExtraProducts({
      enrollmentId,
      items: body.items,
    });
  }

  /**
   * DELETE /enrollments/:id/extra-products/:extraProductId
   * Remove produto extra da matricula
   */
  @Delete(':id/extra-products/:extraProductId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'COLLABORATOR')
  @HttpCode(HttpStatus.OK)
  async removeExtraProduct(
    @Param('id') enrollmentId: string,
    @Param('extraProductId') extraProductId: string,
  ) {
    return this.enrollmentsService.removeExtraProduct(enrollmentId, extraProductId);
  }

  /**
   * GET /enrollments/:id/extra-products
   * Lista produtos extras vinculados a matricula
   */
  @Get(':id/extra-products')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER')
  async getExtraProducts(@Param('id') enrollmentId: string) {
    return this.enrollmentsService.getExtraProducts(enrollmentId);
  }

  /**
   * POST /enrollments/:id/generate-token
   * Gera token de matrícula para o aluno preencher dados
   */
  @Post(':id/generate-token')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'COLLABORATOR')
  @HttpCode(HttpStatus.OK)
  async generateToken(
    @Param('id') enrollmentId: string,
    @Body(new ZodValidationPipe(GenerateEnrollmentTokenSchema))
    body: Partial<GenerateEnrollmentTokenDto>,
  ) {
    return this.enrollmentsService.generateEnrollmentToken({
      enrollmentId,
      expiresInHours: body.expiresInHours || 24,
    });
  }

  /**
   * POST /enrollments/validate-token
   * Valida token e retorna dados da matrícula
   */
  @Post('validate-token')
  @Public()
  @HttpCode(HttpStatus.OK)
  async validateToken(
    @Body(new ZodValidationPipe(ValidateEnrollmentTokenSchema))
    body: ValidateEnrollmentTokenDto,
  ) {
    return this.enrollmentsService.validateToken(body);
  }

  /**
   * POST /enrollments/public/:token/documents
   * Upload público de documento via token de matrícula (sem JWT)
   */
  @Post('public/:token/documents')
  @Public()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  async uploadPublicDocument(
    @Param('token') token: string,
    @UploadedFile() file: any,
    @Body('type') type?: string,
    @Body('documentType') documentType?: string,
  ) {
    return this.enrollmentsService.uploadPublicDocumentByToken({
      token,
      documentType: (type || documentType || '').trim(),
      file,
    });
  }

  /**
   * DELETE /enrollments/public/:token/documents/:documentId
   * Remove documento público enviado via token de matrícula (sem JWT)
   */
  @Delete('public/:token/documents/:documentId')
  @Public()
  @HttpCode(HttpStatus.OK)
  async deletePublicDocument(
    @Param('token') token: string,
    @Param('documentId') documentId: string,
  ) {
    return this.enrollmentsService.deletePublicDocumentByToken({ token, documentId });
  }

  /**
   * POST /enrollments/:id/request-discount
   * Solicita desconto para aprovação do MASTER
   */
  @Post(':id/request-discount')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'COLLABORATOR')
  @HttpCode(HttpStatus.OK)
  async requestDiscount(
    @Param('id') enrollmentId: string,
    @Body(new ZodValidationPipe(RequestDiscountSchema))
    body: Omit<RequestDiscountDto, 'enrollmentId'>,
  ) {
    return this.enrollmentsService.requestDiscount({
      enrollmentId,
      ...body,
    });
  }

  /**
   * POST /enrollments/:id/approve-discount
   * Aprova desconto (apenas MASTER)
   */
  @Post(':id/approve-discount')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER')
  @HttpCode(HttpStatus.OK)
  async approveDiscount(
    @Param('id') enrollmentId: string,
    @Body(new ZodValidationPipe(ApproveDiscountSchema))
    body: Omit<ApproveDiscountDto, 'enrollmentId'>,
  ) {
    return this.enrollmentsService.approveDiscount({
      enrollmentId,
      ...body,
    });
  }

  /**
   * POST /enrollments/:id/revoke-discount
   * Revoga desconto aprovado (apenas MASTER)
   */
  @Post(':id/revoke-discount')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER')
  @HttpCode(HttpStatus.OK)
  async revokeDiscount(@Param('id') enrollmentId: string, @Body() body: { masterId: string }) {
    return this.enrollmentsService.revokeDiscount(enrollmentId, body.masterId);
  }

  /**
   * POST /enrollments/:id/status
   * Atualiza status da matrícula
   */
  @Post(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'COLLABORATOR')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') enrollmentId: string,
    @Body(new ZodValidationPipe(UpdateEnrollmentStatusSchema))
    body: Omit<UpdateEnrollmentStatusDto, 'enrollmentId'>,
  ) {
    return this.enrollmentsService.updateStatus({
      enrollmentId,
      ...body,
    });
  }

  /**
   * GET /enrollments/:id
   * Busca detalhes completos de uma matrícula
   */
  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER')
  async findOne(@Param('id') id: string) {
    return this.enrollmentsService.findOne(id);
  }

  /**
   * GET /enrollments/class/:classId
   * Lista matrículas de uma turma (dashboard)
   */
  @Get('class/:classId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER')
  async findByClass(@Param('classId') classId: string) {
    return this.enrollmentsService.findByClass(classId);
  }
}
