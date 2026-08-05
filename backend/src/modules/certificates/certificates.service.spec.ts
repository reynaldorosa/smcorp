import { Test, TestingModule } from '@nestjs/testing';
import { CertificatesService } from './certificates.service';
import { CertificatePdfService } from './certificate-pdf.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('CertificatesService', () => {
  let service: CertificatesService;

  const mockPrismaService = {
    certificate: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    enrollment: {
      findUnique: jest.fn(),
    },
  };

  const mockCertificatePdf = {
    generate: jest.fn(),
  };

  const mockIssuedCert = {
    id: 'cert-1',
    code: 'CERT0001',
    certificateNumber: 'SMCORP-2026-00001',
    status: 'ISSUED',
    issuedAt: new Date('2026-08-01'),
    expiresAt: new Date('2027-08-01'),
    validityMonths: 12,
    metadata: { nota: 9.5 },
    deletedAt: null,
    student: {
      id: 's1',
      name: 'Aluno Teste',
      cpf: '12345678909',
      code: 'A0001',
      email: null,
      phone: null,
    },
    course: {
      id: 'c1',
      name: 'Curso Teste',
      code: 'CT1',
      validityMonths: 12,
      durationHours: 40,
      certificationInfo: null,
    },
    enrollment: { id: 'e1', status: 'PRESENT', enrolledAt: null, confirmedAt: null },
    issuedBy: { id: 'u1', name: 'Emissor Teste' },
    template: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificatesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CertificatePdfService, useValue: mockCertificatePdf },
      ],
    }).compile();

    service = module.get<CertificatesService>(CertificatesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('download', () => {
    it('gera o PDF de um certificado emitido com dados completos', async () => {
      mockPrismaService.certificate.findUnique.mockResolvedValue(mockIssuedCert);
      mockCertificatePdf.generate.mockResolvedValue(Buffer.from('%PDF-1.4 fake-content'));

      const result = await service.download('cert-1');

      expect(result).toBeInstanceOf(Buffer);
      expect(mockCertificatePdf.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          certificateNumber: 'SMCORP-2026-00001',
          validityMonths: 12,
          student: { name: 'Aluno Teste', cpf: '12345678909' },
          course: { name: 'Curso Teste', code: 'CT1', durationHours: 40 },
          issuedBy: { name: 'Emissor Teste' },
        }),
        expect.stringContaining('verificar-certificado?numero=SMCORP-2026-00001'),
      );
    });

    it('rejeita download de certificado em rascunho', async () => {
      mockPrismaService.certificate.findUnique.mockResolvedValue({
        ...mockIssuedCert,
        status: 'DRAFT',
      });

      await expect(service.download('cert-1')).rejects.toThrow(BadRequestException);
      expect(mockCertificatePdf.generate).not.toHaveBeenCalled();
    });

    it('lança NotFoundException quando o certificado não existe', async () => {
      mockPrismaService.certificate.findUnique.mockResolvedValue(null);

      await expect(service.download('inexistente')).rejects.toThrow(NotFoundException);
    });
  });
});
