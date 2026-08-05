import {
  Controller,
  Post,
  Headers,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeController } from '@nestjs/swagger';
import { MercadoPagoService } from './mercadopago.service';
import { Public } from '../auth/decorators/public.decorator';

interface MercadoPagoWebhookBody {
  action?: string;
  type?: string;
  data?: { id?: string };
  date_created?: string;
}

/**
 * Receptor de webhooks do Mercado Pago (público).
 * Eventos: payment.*, subscription_preapproval.*, subscription_authorized_payment.*
 */
@ApiTags('Webhooks')
@ApiExcludeController()
@Controller('webhooks/mercadopago')
export class MercadoPagoWebhookController {
  constructor(private readonly mercadopagoService: MercadoPagoService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook do Mercado Pago (assinatura HMAC verificada)' })
  async handleWebhook(
    @Body() body: MercadoPagoWebhookBody,
    @Headers('x-signature') signatureHeader?: string,
    @Headers('x-request-id') xRequestId?: string,
    @Query('id') queryId?: string,
    @Query('type') queryType?: string,
  ) {
    const action = body.action || queryType || '';
    const dataId = String(body.data?.id || queryId || '');

    if (!action || !dataId) {
      throw new BadRequestException('Evento de webhook inválido (sem action/data.id)');
    }

    // O MP envia ts/v1 no header x-signature
    const tsMatch = signatureHeader?.match(/ts=(\d+)/);
    const ts = tsMatch ? tsMatch[1] : '';

    try {
      return await this.mercadopagoService.handleWebhookEvent({
        action,
        type: body.type,
        dataId,
        ts,
        signatureHeader,
        xRequestId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const lower = message.toLowerCase();
      if (
        lower.includes('assinatura') ||
        lower.includes('não configurado') ||
        lower.includes('nao configurado')
      ) {
        throw new UnauthorizedException(message);
      }
      throw error;
    }
  }
}
