import { SmtpEmailProvider } from './smtp-email.provider';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'smtp-msg-1' }),
    close: jest.fn(),
  })),
}));

import * as nodemailer from 'nodemailer';

describe('SmtpEmailProvider', () => {
  let provider: SmtpEmailProvider;

  beforeEach(() => {
    provider = new SmtpEmailProvider();
    jest.clearAllMocks();
  });

  it('envia e-mail via transporte SMTP com autenticação', async () => {
    const result = await provider.send({
      to: 'aluno@exemplo.com',
      subject: 'Assunto',
      html: '<p>Corpo</p>',
      smtp: {
        host: 'smtp.exemplo.com',
        port: 587,
        user: 'usuario',
        password: 'senha',
        from: 'contato@caiso.com.br',
        fromName: 'Caiso',
        useSsl: false,
        active: true,
      },
    });

    expect(result.messageId).toBe('smtp-msg-1');
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.exemplo.com',
        port: 587,
        secure: false,
        auth: { user: 'usuario', pass: 'senha' },
      }),
    );
  });

  it('funciona sem autenticação (SMTP sem user)', async () => {
    await provider.send({
      to: 'a@b.com',
      subject: 's',
      html: '<p>x</p>',
      smtp: { host: 'smtp.exemplo.com', port: 25 },
    });

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.not.objectContaining({ auth: expect.anything() }),
    );
  });

  it('lança erro quando host/porta ausentes', async () => {
    await expect(
      provider.send({
        to: 'a@b.com',
        subject: 's',
        html: '<p>x</p>',
        smtp: { host: '', port: undefined as unknown as number },
      }),
    ).rejects.toThrow('SMTP sem host/porta configurados');
  });
});
