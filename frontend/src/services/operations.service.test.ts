import { beforeEach, describe, expect, it, vi } from 'vitest';

const getMock = vi.fn();
const postMock = vi.fn();
const putMock = vi.fn();
const deleteMock = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    get: (...args: unknown[]) => getMock(...args),
    post: (...args: unknown[]) => postMock(...args),
    put: (...args: unknown[]) => putMock(...args),
    delete: (...args: unknown[]) => deleteMock(...args),
  },
}));

import { enrollmentOperations, documentOperations } from './operations.service';

describe('operations.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gera token de matrícula no endpoint correto', async () => {
    postMock.mockResolvedValue({ data: { enrollmentToken: 't1' } });

    const response = await enrollmentOperations.generateToken({
      enrollmentId: 'e1',
      expiresInHours: 24,
    } as any);

    expect(postMock).toHaveBeenCalledWith('/enrollments/e1/generate-token', {
      enrollmentId: 'e1',
      expiresInHours: 24,
    });
    expect(response.enrollmentToken).toBe('t1');
  });

  it('consulta QR code SVG pelo endpoint específico', async () => {
    getMock.mockResolvedValue({ data: { svg: '<svg />' } });

    await enrollmentOperations.getQRCode('e1', 'svg');

    expect(getMock).toHaveBeenCalledWith('/enrollments/qrcode/e1/svg');
  });

  it('notifica documentos pendentes no endpoint de student-documents', async () => {
    postMock.mockResolvedValue({ data: { success: true } });

    await documentOperations.notifyPending('doc-1', {
      notificationType: 'both',
      customMessage: 'Favor enviar documentos',
    });

    expect(postMock).toHaveBeenCalledWith('/student-documents/doc-1/notify-pending', {
      notificationType: 'both',
      customMessage: 'Favor enviar documentos',
    });
  });
});
