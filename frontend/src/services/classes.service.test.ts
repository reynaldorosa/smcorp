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

import { classesService } from './classes.service';

describe('classesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mapeia classes da API para store no getAll', async () => {
    getMock.mockResolvedValue({
      data: {
        data: [
          {
            id: 'cl1',
            code: 'T-01',
            courseId: 'c1',
            roomId: 'r1',
            instructorId: 'i1',
            companyId: null,
            displayName: 'Turma NR-35',
            customPrice: 1500,
            startDate: '2026-02-12',
            endDate: '2026-02-13',
            startTime: '08:00',
            endTime: '17:00',
            maxStudents: 20,
            status: 'SCHEDULED',
            createdAt: '2026-02-12T00:00:00.000Z',
            updatedAt: '2026-02-12T00:00:00.000Z',
            course: { name: 'NR-35' },
            _count: { enrollments: 5 },
          },
        ],
      },
    });

    const result = await classesService.getAll();

    expect(getMock).toHaveBeenCalledWith('/classes', { params: { limit: 1000 } });
    expect(result[0].status).toBe('Planned');
    expect(result[0].availableSpots).toBe(15);
    expect(result[0].name).toBe('NR-35');
  });

  it('converte status da store para API no update', async () => {
    putMock.mockResolvedValue({
      data: {
        id: 'cl1',
        code: 'T-01',
        courseId: 'c1',
        startDate: '2026-02-12',
        endDate: '2026-02-13',
        maxStudents: 20,
        status: 'IN_PROGRESS',
        createdAt: '2026-02-12T00:00:00.000Z',
        updatedAt: '2026-02-12T00:00:00.000Z',
      },
    });

    await classesService.update('cl1', { status: 'InProgress' });

    expect(putMock).toHaveBeenCalledWith('/classes/cl1', { status: 'IN_PROGRESS' });
  });
});
