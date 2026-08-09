import { CertificatePdfService } from './certificate-pdf.service';

describe('CertificatePdfService', () => {
  let service: CertificatePdfService;

  beforeEach(() => {
    service = new CertificatePdfService();
  });

  it('gera um buffer PDF válido com os dados do certificado', async () => {
    const buffer = await service.generate(
      {
        certificateNumber: 'CAISO-2026-00001',
        issuedAt: new Date('2026-08-01'),
        expiresAt: new Date('2027-08-01'),
        validityMonths: 12,
        metadata: { nota: 9.5 },
        student: { name: 'Aluno Teste', cpf: '12345678909' },
        course: { name: 'Curso Teste', code: 'CT1', durationHours: 40 },
        issuedBy: { name: 'Emissor Teste' },
      },
      'https://caiso.com.br/verificar-certificado?numero=CAISO-2026-00001',
    );

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it('funciona sem dados opcionais (aluno/curso ausentes)', async () => {
    const buffer = await service.generate(
      {
        certificateNumber: 'CAISO-2026-00002',
        issuedAt: null,
        expiresAt: null,
        validityMonths: 6,
        metadata: null,
        student: null,
        course: null,
        issuedBy: null,
      },
      'https://caiso.com.br/verificar-certificado?numero=CAISO-2026-00002',
    );

    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  });
});
