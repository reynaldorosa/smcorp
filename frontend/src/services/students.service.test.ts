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

import { studentsService } from './students.service';

describe('studentsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mapeia aluno com waiting list em getAll', async () => {
    getMock.mockResolvedValue({
      data: [
        {
          id: 's1',
          code: 'A0001',
          name: 'Aluno Lista',
          cpf: '12345678900',
          email: 'aluno@teste.com',
          phone: '11999999999',
          isActive: true,
          createdAt: '2026-02-12T00:00:00.000Z',
          updatedAt: '2026-02-12T00:00:00.000Z',
          enrollments: [
            {
              id: 'e1',
              classId: 'cl1',
              documentsStatus: 'PENDING',
              status: 'WAITING_LIST',
              notes: 'aguardando vaga',
            },
          ],
        },
      ],
    });

    const result = await studentsService.getAll();

    expect(getMock).toHaveBeenCalledWith('/students');
    expect(result[0].status).toBe('WaitingList');
    expect(result[0].enrollmentId).toBe('e1');
  });

  it('não infere fila de espera a partir do texto das observações', async () => {
    // Regressão: antes o status vinha de notes.includes('[WAITING_LIST]'),
    // então digitar esse texto nas observações mudava o status do aluno.
    getMock.mockResolvedValue({
      data: [
        {
          id: 's2',
          code: 'A0002',
          name: 'Aluno Ativo',
          cpf: '98765432100',
          isActive: true,
          createdAt: '2026-02-12T00:00:00.000Z',
          updatedAt: '2026-02-12T00:00:00.000Z',
          enrollments: [
            {
              id: 'e2',
              classId: 'cl1',
              documentsStatus: 'COMPLETE',
              status: 'CONFIRMED',
              notes: 'cliente perguntou sobre [WAITING_LIST] no atendimento',
            },
          ],
        },
      ],
    });

    const result = await studentsService.getAll();

    expect(result[0].status).toBe('Active');
  });

  it('matricula aluno no endpoint de enrollments', async () => {
    postMock.mockResolvedValue({ data: {} });

    await studentsService.enroll({
      studentId: 's1',
      classId: 'cl1',
      companyId: 'comp1',
      paymentMethod: 'PIX',
    });

    expect(postMock).toHaveBeenCalledWith('/enrollments', {
      studentId: 's1',
      classId: 'cl1',
      companyId: 'comp1',
      paymentMethod: 'PIX',
    });
  });
});
