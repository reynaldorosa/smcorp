import { Test, TestingModule } from '@nestjs/testing';
import { MercadoPagoWebhookController } from './mercadopago.controller';
import { MercadoPagoService } from './mercadopago.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('MercadoPagoWebhookController', () => {
  const mockMercadoPagoService = {
    handleWebhookEvent: jest.fn(),
  };

  let controller: MercadoPagoWebhookController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MercadoPagoWebhookController],
      providers: [{ provide: MercadoPagoService, useValue: mockMercadoPagoService }],
    }).compile();

    controller = module.get<MercadoPagoWebhookController>(MercadoPagoWebhookController);
    jest.clearAllMocks();
  });

  it('delega evento válido (body com action e data.id) para o serviço', async () => {
    mockMercadoPagoService.handleWebhookEvent.mockResolvedValue({
      handled: true,
      detail: 'pagamento marcado como pago',
    });

    const result = await controller.handleWebhook(
      { action: 'payment.created', data: { id: 'mp-1' } },
      'ts=1,v1=abc',
      'req-1',
      undefined,
      undefined,
    );

    expect(result.handled).toBe(true);
    expect(mockMercadoPagoService.handleWebhookEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'payment.created',
        dataId: 'mp-1',
        signatureHeader: 'ts=1,v1=abc',
        xRequestId: 'req-1',
      }),
    );
  });

  it('usa query id/type quando o body não tem data.id', async () => {
    mockMercadoPagoService.handleWebhookEvent.mockResolvedValue({
      handled: false,
      detail: 'ok',
    });

    await controller.handleWebhook({}, undefined, undefined, 'mp-2', 'payment');

    expect(mockMercadoPagoService.handleWebhookEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'payment', dataId: 'mp-2' }),
    );
  });

  it('rejeita payload sem action nem data.id (400)', async () => {
    await expect(
      controller.handleWebhook({}, undefined, undefined, undefined, undefined),
    ).rejects.toThrow(BadRequestException);
    expect(mockMercadoPagoService.handleWebhookEvent).not.toHaveBeenCalled();
  });

  it('converte assinatura inválida em 401', async () => {
    mockMercadoPagoService.handleWebhookEvent.mockRejectedValue(
      new Error('Assinatura do webhook inválida'),
    );

    await expect(
      controller.handleWebhook(
        { action: 'payment.created', data: { id: 'mp-1' } },
        'ts=1,v1=errado',
        'req-1',
        undefined,
        undefined,
      ),
    ).rejects.toThrow(UnauthorizedException);
  });
});
