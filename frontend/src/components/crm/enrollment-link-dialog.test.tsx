import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { EnrollmentLinkDialog } from './enrollment-link-dialog';

const getByIdMock = vi.fn();

vi.mock('@/services/students.service', () => ({
  studentsService: {
    getById: (...args: unknown[]) => getByIdMock(...args),
  },
}));

vi.mock('@/components/dashboard/resend-link-dialog', () => ({
  ResendLinkDialog: ({ open, student }: { open: boolean; student: { name: string } }) =>
    open ? <div>QR do link de {student.name}</div> : null,
}));

describe('EnrollmentLinkDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolve a matrícula ativa do aluno e abre o QR do link', async () => {
    getByIdMock.mockResolvedValue({
      id: 's1',
      enrollments: [
        { id: 'e-cancelled', status: 'CANCELLED' },
        { id: 'e-ativa', status: 'CONFIRMED', documentsStatus: 'PENDING' },
      ],
    });

    render(
      <EnrollmentLinkDialog open studentId="s1" studentName="Ana Silva" onClose={() => {}} />,
    );

    await waitFor(() => {
      expect(screen.getByText('QR do link de Ana Silva')).toBeTruthy();
    });
    expect(getByIdMock).toHaveBeenCalledWith('s1');
  });

  it('ignora matrículas canceladas/ausentes', async () => {
    getByIdMock.mockResolvedValue({
      id: 's1',
      enrollments: [{ id: 'e-x', status: 'CANCELLED' }],
    });

    render(
      <EnrollmentLinkDialog open studentId="s1" studentName="Ana Silva" onClose={() => {}} />,
    );

    await waitFor(() => {
      expect(screen.getByText('Este aluno não possui matrícula ativa.')).toBeTruthy();
    });
  });
});
