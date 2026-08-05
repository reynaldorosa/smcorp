import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UniqSuporteProvider } from './uniq-suporte.provider';

describe('UniqSuporteProvider', () => {
  const mockFetch = jest.fn();

  const makeProvider = async (overrides: Record<string, string> = {}) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UniqSuporteProvider,
        { provide: ConfigService, useValue: { get: (k: string) => overrides[k] } },
      ],
    }).compile();
    return module.get<UniqSuporteProvider>(UniqSuporteProvider);
  };

  const okResponse = (body: unknown) =>
    ({ ok: true, status: 200, json: async () => body }) as Response;

  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it('isConfigured() = false sem chave', async () => {
    const provider = await makeProvider();
    expect(provider.isConfigured()).toBe(false);
  });

  describe('enviar e-mail', () => {
    it('POST /api/email/send com header Api-key e payload correto', async () => {
      mockFetch.mockResolvedValue(
        okResponse({ status: 'success', data: { id: 42, status: 'pending' } }),
      );
      const provider = await makeProvider({ MESSAGING_API_KEY: 'chave-teste' });

      const result = await provider.sendEmail({
        to: 'aluno@exemplo.com',
        subject: 'Assunto',
        html: '<p>Olá</p>',
        senderName: 'SMCORP',
      });

      expect(result.messageId).toBe('42');
      expect(result.providerStatus).toBe('pending');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://connect.uniqsuporte.com.br/api/email/send',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Api-key': 'chave-teste' }),
          body: expect.stringContaining('"email":"aluno@exemplo.com"'),
        }),
      );
    });

    it('lança erro com mensagem do provedor (ex: API key inválida)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ status: 'error', message: 'Invalid API key' }),
      } as Response);
      const provider = await makeProvider({ MESSAGING_API_KEY: 'errada' });

      await expect(
        provider.sendEmail({ to: 'a@b.com', subject: 's', html: '<p>x</p>' }),
      ).rejects.toThrow('Invalid API key');
    });
  });

  describe('enviar whatsapp/sms', () => {
    it('POST /api/whatsapp/send com número e mensagem', async () => {
      mockFetch.mockResolvedValue(
        okResponse({ status: 'success', data: { id: 7, status: 'pending' } }),
      );
      const provider = await makeProvider({ MESSAGING_API_KEY: 'chave-teste' });

      const result = await provider.sendWhatsApp({ to: '5511999999999', message: 'Olá!' });

      expect(result.messageId).toBe('7');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://connect.uniqsuporte.com.br/api/whatsapp/send',
        expect.objectContaining({ body: expect.stringContaining('"number":"5511999999999"') }),
      );
    });

    it('POST /api/sms/send', async () => {
      mockFetch.mockResolvedValue(
        okResponse({ status: 'success', data: { id: 9, status: 'pending' } }),
      );
      const provider = await makeProvider({ MESSAGING_API_KEY: 'chave-teste' });

      const result = await provider.sendSms({ to: '5511999999999', message: 'Olá!' });

      expect(result.messageId).toBe('9');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://connect.uniqsuporte.com.br/api/sms/send',
        expect.any(Object),
      );
    });
  });

  describe('getDeliveryStatus', () => {
    it('retorna status do provedor', async () => {
      mockFetch.mockResolvedValue(okResponse({ data: { status: 'delivered' } }));
      const provider = await makeProvider({ MESSAGING_API_KEY: 'chave-teste' });

      const status = await provider.getDeliveryStatus('whatsapp', '7');

      expect(status).toBe('delivered');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://connect.uniqsuporte.com.br/api/get/whatsapp/7',
        expect.any(Object),
      );
    });

    it('retorna null em falha HTTP', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 } as Response);
      const provider = await makeProvider({ MESSAGING_API_KEY: 'chave-teste' });

      expect(await provider.getDeliveryStatus('email', '1')).toBeNull();
    });
  });
});
