import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { runInNewContext } from 'vm';
import pdfmake = require('pdfmake');

const nodeRequire = createRequire(__filename);

// Fonte usada pelo pdfmake (embutida no vfs_fonts do próprio pacote)
const ROBOTO_FONTS = [
  'Roboto-Regular.ttf',
  'Roboto-Medium.ttf',
  'Roboto-Italic.ttf',
  'Roboto-MediumItalic.ttf',
];

interface CertificatePdfData {
  certificateNumber: string;
  issuedAt: Date | null;
  expiresAt: Date | null;
  validityMonths: number;
  metadata?: Record<string, unknown> | null;
  student?: { name: string; cpf?: string | null } | null;
  course?: { name: string; code: string; durationHours: number } | null;
  issuedBy?: { name?: string | null } | null;
}

/**
 * Gera o PDF do certificado com pdfmake (modo servidor).
 * As fontes Roboto são carregadas uma única vez a partir do vfs_fonts.js
 * embutido no pacote — sem dependência de arquivos externos.
 */
@Injectable()
export class CertificatePdfService implements OnModuleInit {
  private readonly logger = new Logger(CertificatePdfService.name);
  private fontsLoaded = false;

  onModuleInit() {
    this.ensureFonts();
  }

  private ensureFonts() {
    if (this.fontsLoaded) return;

    const vfsCode = readFileSync(nodeRequire.resolve('pdfmake/build/vfs_fonts.js'), 'utf8');
    const sandbox: { vfs?: Record<string, string> } = {};
    runInNewContext(vfsCode, sandbox);
    const vfs = sandbox.vfs || {};

    for (const fontName of ROBOTO_FONTS) {
      const base64 = vfs[fontName];
      if (!base64) {
        throw new Error(`Fonte "${fontName}" ausente no vfs_fonts do pdfmake`);
      }
      pdfmake.virtualfs.writeFileSync(fontName, Buffer.from(base64, 'base64'));
    }

    pdfmake.addFonts({
      Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf',
      },
    });

    // O certificado não carrega recursos externos: bloqueia URLs e arquivos locais.
    pdfmake.setUrlAccessPolicy(() => false);
    pdfmake.setLocalAccessPolicy(() => false);

    this.fontsLoaded = true;
    this.logger.log('Fontes Roboto do pdfmake carregadas');
  }

  /**
   * Gera o PDF do certificado.
   * @param data Dados do certificado (com aluno, curso e emissor)
   * @param verifyUrl URL pública de verificação de autenticidade
   */
  async generate(data: CertificatePdfData, verifyUrl: string): Promise<Buffer> {
    this.ensureFonts();
    const institution = process.env.INSTITUTION_NAME || 'SMCORP';

    const issuedAt = data.issuedAt ? this.formatDate(data.issuedAt) : '—';
    const expiresAt = data.expiresAt ? this.formatDate(data.expiresAt) : '—';
    const studentName = data.student?.name || '—';
    const cpfLine = data.student?.cpf ? `CPF: ${this.formatCpf(data.student.cpf)}` : undefined;
    const courseName = data.course?.name || '—';
    const courseDetails = [
      data.course?.code && `Código: ${data.course.code}`,
      data.course?.durationHours && `Carga horária: ${data.course.durationHours}h`,
      `Validade: ${data.validityMonths} meses`,
    ]
      .filter(Boolean)
      .join('  •  ');

    const metadata = data.metadata || {};
    const score =
      typeof metadata.nota === 'number'
        ? `Nota: ${metadata.nota}`
        : typeof metadata.score === 'number'
          ? `Nota: ${metadata.score}`
          : undefined;

    const signatureLeft = data.issuedBy?.name || 'Emissor';
    const signatureRight = institution;

    const docDefinition = {
      pageSize: 'A4',
      pageOrientation: 'landscape',
      pageMargins: 20,
      defaultStyle: { font: 'Roboto' },
      content: [
        // Moldura externa (tabela de 1 célula com borda espessa)
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  stack: [
                    {
                      text: institution,
                      style: 'institution',
                      alignment: 'center',
                    },
                    {
                      text: 'CERTIFICADO DE CONCLUSÃO',
                      style: 'title',
                      alignment: 'center',
                    },
                    {
                      canvas: [
                        {
                          type: 'line',
                          x1: 0,
                          y1: 0,
                          x2: 460,
                          y2: 0,
                          lineWidth: 1.2,
                          lineColor: '#1e40af',
                        },
                      ],
                      alignment: 'center',
                      margin: [0, 2, 0, 14],
                    },
                    { text: 'Certificamos que', alignment: 'center', style: 'label' },
                    { text: studentName, style: 'student', alignment: 'center' },
                    ...(cpfLine
                      ? [
                          {
                            text: cpfLine,
                            alignment: 'center',
                            style: 'muted',
                            margin: [0, 2, 0, 8],
                          },
                        ]
                      : [{ text: '', margin: [0, 0, 0, 6] }]),
                    {
                      text: 'concluiu com aproveitamento o curso',
                      alignment: 'center',
                      style: 'label',
                    },
                    { text: courseName, style: 'course', alignment: 'center' },
                    {
                      text: courseDetails,
                      alignment: 'center',
                      style: 'muted',
                      margin: [0, 4, 0, 10],
                    },
                    ...(score
                      ? [{ text: score, alignment: 'center', style: 'muted', margin: [0, 0, 0, 8] }]
                      : []),
                    // Nº / Emissão / Validade
                    {
                      table: {
                        widths: ['*', '*', '*'],
                        body: [
                          [
                            { text: 'Nº do Certificado', style: 'cellLabel' },
                            { text: 'Data de Emissão', style: 'cellLabel' },
                            { text: 'Validade até', style: 'cellLabel' },
                          ],
                          [
                            { text: data.certificateNumber, style: 'cellValue' },
                            { text: issuedAt, style: 'cellValue' },
                            { text: expiresAt, style: 'cellValue' },
                          ],
                        ],
                      },
                      layout: {
                        hLineWidth: (rowIndex: number, node: any) =>
                          rowIndex === 0 ? 1 : node.table.body.length - 1 === rowIndex ? 0.6 : 0.4,
                        vLineWidth: () => 0.4,
                        hLineColor: () => '#94a3b8',
                        vLineColor: () => '#cbd5e1',
                        paddingTop: () => 6,
                        paddingBottom: () => 6,
                      },
                      alignment: 'center',
                      margin: [60, 0, 60, 12],
                    },
                    // QR de verificação
                    { qr: verifyUrl, fit: 84, alignment: 'center', margin: [0, 0, 0, 2] },
                    {
                      text: `Verifique a autenticidade: ${verifyUrl}`,
                      alignment: 'center',
                      style: 'mutedSmall',
                    },
                    // Assinaturas
                    {
                      table: {
                        widths: ['*', '*'],
                        body: [
                          [
                            { text: '', margin: [0, 26, 0, 0] },
                            { text: '', margin: [0, 26, 0, 0] },
                          ],
                          [
                            {
                              canvas: [
                                {
                                  type: 'line',
                                  x1: 10,
                                  y1: 0,
                                  x2: 150,
                                  y2: 0,
                                  lineWidth: 0.6,
                                  lineColor: '#334155',
                                },
                              ],
                              margin: [0, 0, 0, 4],
                            },
                            {
                              canvas: [
                                {
                                  type: 'line',
                                  x1: 10,
                                  y1: 0,
                                  x2: 150,
                                  y2: 0,
                                  lineWidth: 0.6,
                                  lineColor: '#334155',
                                },
                              ],
                              margin: [0, 0, 0, 4],
                            },
                          ],
                          [
                            { text: signatureLeft, style: 'signature' },
                            { text: signatureRight, style: 'signature' },
                          ],
                        ],
                      },
                      layout: {
                        hLineWidth: () => 0,
                        vLineWidth: () => 0,
                        paddingLeft: () => 30,
                        paddingRight: () => 30,
                      },
                      margin: [80, 8, 80, 0],
                    },
                  ],
                  margin: 26,
                },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 2.5,
            vLineWidth: () => 2.5,
            hLineColor: () => '#1e40af',
            vLineColor: () => '#1e40af',
          },
        },
      ],
      styles: {
        institution: { fontSize: 13, bold: true, color: '#1e40af', margin: [0, 4, 0, 2] },
        title: { fontSize: 20, bold: true, color: '#1e293b', margin: [0, 0, 0, 6] },
        label: { fontSize: 11, color: '#475569', margin: [0, 0, 0, 2] },
        student: { fontSize: 24, bold: true, color: '#0f172a', margin: [0, 4, 0, 2] },
        course: { fontSize: 16, bold: true, color: '#1e40af', margin: [0, 4, 0, 0] },
        muted: { fontSize: 10, color: '#64748b' },
        mutedSmall: { fontSize: 8.5, color: '#64748b', margin: [0, 0, 0, 4] },
        cellLabel: { fontSize: 8.5, bold: true, color: '#475569', alignment: 'center' },
        cellValue: { fontSize: 10, bold: true, color: '#0f172a', alignment: 'center' },
        signature: { fontSize: 10, alignment: 'center', color: '#334155' },
      },
    };

    const doc = pdfmake.createPdf(docDefinition as Record<string, unknown>);
    return doc.getBuffer();
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  }

  private formatCpf(cpf: string): string {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11) return cpf;
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
}
