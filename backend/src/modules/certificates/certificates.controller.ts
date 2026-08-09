import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';
import { CreateCertificateDto, CreateCertificateSchema } from './dto/create-certificate.dto';
import { UpdateCertificateDto, UpdateCertificateSchema } from './dto/update-certificate.dto';
import { IssueCertificateDto, IssueCertificateSchema } from './dto/issue-certificate.dto';
import { RevokeCertificateDto, RevokeCertificateSchema } from './dto/revoke-certificate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('Certificates')
@ApiBearerAuth()
@Controller('certificates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  findAll(
    @Query('status') status?: string,
    @Query('courseId') courseId?: string,
    @Query('studentId') studentId?: string,
    @Query('search') search?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.certificatesService.findAll({
      status,
      courseId,
      studentId,
      search,
      includeDeleted: includeDeleted === 'true',
    });
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  getStats() {
    return this.certificatesService.getStats();
  }

  @Get('verify/:number')
  // Verificação de autenticidade é PÚBLICA (link/QR no certificado impresso)
  @Public()
  verifyByNumber(@Param('number') number: string) {
    return this.certificatesService.verifyByNumber(number);
  }

  @Get(':id/download')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  async download(@Param('id') id: string): Promise<StreamableFile> {
    const pdf = await this.certificatesService.download(id);
    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: `attachment; filename="certificado-${id}.pdf"`,
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  findOne(@Param('id') id: string) {
    return this.certificatesService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  create(
    @Body(new ZodValidationPipe(CreateCertificateSchema))
    dto: CreateCertificateDto,
  ) {
    return this.certificatesService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateCertificateSchema))
    dto: UpdateCertificateDto,
  ) {
    return this.certificatesService.update(id, dto);
  }

  @Post(':id/issue')
  @Roles(UserRole.ADMIN)
  issue(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(IssueCertificateSchema))
    dto: IssueCertificateDto,
  ) {
    return this.certificatesService.issue(id, dto);
  }

  @Post(':id/revoke')
  @Roles(UserRole.ADMIN)
  revoke(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(RevokeCertificateSchema))
    dto: RevokeCertificateDto,
  ) {
    return this.certificatesService.revoke(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.certificatesService.softDelete(id);
  }

  @Post(':id/restore')
  @Roles(UserRole.ADMIN)
  restore(@Param('id') id: string) {
    return this.certificatesService.restore(id);
  }
}
