// ============================================
// SMCORP - Sales Module Helpers (Módulo 04)
// ============================================

import type { Contact } from './types';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function getStatusColor(status: Contact['status']): string {
  switch (status) {
    case 'lead':
      return 'bg-yellow-100 text-yellow-700';
    case 'interested':
      return 'bg-blue-100 text-blue-700';
    case 'enrolled':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function getStatusDotColor(status: Contact['status']): string {
  switch (status) {
    case 'lead':
      return 'bg-yellow-500';
    case 'interested':
      return 'bg-blue-500';
    case 'enrolled':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
}

export function getStatusLabel(status: Contact['status']): string {
  switch (status) {
    case 'lead':
      return 'Lead';
    case 'interested':
      return 'Interested';
    case 'enrolled':
      return 'Enrolled';
    default:
      return status;
  }
}
