import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  getStatusColor,
  getStatusDotColor,
  getStatusLabel,
} from './helpers';

describe('sales/helpers', () => {
  it('formata moeda em pt-BR', () => {
    expect(formatCurrency(1234.5)).toContain('1.234,50');
  });

  it('retorna estilos por status', () => {
    expect(getStatusColor('lead')).toBe('bg-yellow-100 text-yellow-700');
    expect(getStatusColor('interested')).toBe('bg-blue-100 text-blue-700');
    expect(getStatusColor('enrolled')).toBe('bg-green-100 text-green-700');
  });

  it('retorna cor do dot por status', () => {
    expect(getStatusDotColor('lead')).toBe('bg-yellow-500');
    expect(getStatusDotColor('interested')).toBe('bg-blue-500');
    expect(getStatusDotColor('enrolled')).toBe('bg-green-500');
  });

  it('retorna labels de status', () => {
    expect(getStatusLabel('lead')).toBe('Lead');
    expect(getStatusLabel('interested')).toBe('Interested');
    expect(getStatusLabel('enrolled')).toBe('Enrolled');
  });
});
