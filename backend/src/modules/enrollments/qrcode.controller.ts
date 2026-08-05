import { Controller, Get, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import * as QRCode from 'qrcode';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('enrollments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
// Prefixo próprio para evitar ambiguidade com as rotas do EnrollmentsController
@Controller('enrollments/qrcode')
export class QRCodeController {
  @Get(':id')
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Gerar QR Code para matrícula' })
  @ApiParam({ name: 'id', description: 'ID do enrollment' })
  async generateQRCode(@Param('id') enrollmentId: string) {
    try {
      // Gerar token único para a matrícula
      const enrollmentData = {
        enrollmentId,
        timestamp: new Date().toISOString(),
        type: 'ENROLLMENT_CHECKIN',
      };

      // Serializar dados
      const qrDataString = JSON.stringify(enrollmentData);

      // Gerar QR Code como Data URL
      const qrCodeDataUrl = await QRCode.toDataURL(qrDataString, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      return {
        enrollmentId,
        qrCode: qrCodeDataUrl,
        data: enrollmentData,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Erro ao gerar QR Code: ${message}`);
    }
  }

  @Get(':id/svg')
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Gerar QR Code para matrícula em formato SVG' })
  @ApiParam({ name: 'id', description: 'ID do enrollment' })
  async generateQRCodeSVG(@Param('id') enrollmentId: string) {
    try {
      const enrollmentData = {
        enrollmentId,
        timestamp: new Date().toISOString(),
        type: 'ENROLLMENT_CHECKIN',
      };

      const qrDataString = JSON.stringify(enrollmentData);

      // Gerar QR Code como SVG
      const qrCodeSVG = await QRCode.toString(qrDataString, {
        errorCorrectionLevel: 'M',
        type: 'svg',
        width: 300,
      });

      return {
        enrollmentId,
        qrCode: qrCodeSVG,
        format: 'svg',
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Erro ao gerar QR Code SVG: ${message}`);
    }
  }
}
