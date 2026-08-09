// ============================================
// Caiso - HTML Receipt Generator
// ============================================

export interface ReceiptData {
  // Receipt info
  receiptNumber: string;
  issueDate: Date;
  
  // Issuing company
  company: {
    name: string;
    companyTaxId: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
  };
  
  // Payer data
  payer: {
    name: string;
    taxId: string;
    address?: string;
    phone?: string;
  };
  
  // Payment data
  payment: {
    amount: number;
    amountInWords: string;
    paymentMethod: string;
    reference: string;
    description: string;
  };
  
  // Additional data
  course?: {
    name: string;
    code: string;
  };
  classInfo?: {
    code: string;
    period: string;
  };
  
  // Notes
  notes?: string;
}

/**
 * Converts a number to its written form in Portuguese (Brazilian currency)
 */
export function valueInWords(amount: number): string {
  const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const specials = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  function toWords(n: number): string {
    if (n === 0) return 'zero';
    if (n === 100) return 'cem';
    if (n < 10) return units[n];
    if (n < 20) return specials[n - 10];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const unit = n % 10;
      return tens[ten] + (unit ? ' e ' + units[unit] : '');
    }
    if (n < 1000) {
      const hundred = Math.floor(n / 100);
      const remainder = n % 100;
      return hundreds[hundred] + (remainder ? ' e ' + toWords(remainder) : '');
    }
    if (n < 1000000) {
      const thousands = Math.floor(n / 1000);
      const remainder = n % 1000;
      const thousandStr = thousands === 1 ? 'mil' : toWords(thousands) + ' mil';
      return thousandStr + (remainder ? (remainder < 100 ? ' e ' : ' ') + toWords(remainder) : '');
    }
    return 'valor muito alto';
  }

  const reais = Math.floor(amount);
  const cents = Math.round((amount - reais) * 100);

  let result = '';
  if (reais > 0) {
    result = toWords(reais) + (reais === 1 ? ' real' : ' reais');
  }
  if (cents > 0) {
    result += (reais > 0 ? ' e ' : '') + toWords(cents) + (cents === 1 ? ' centavo' : ' centavos');
  }
  if (reais === 0 && cents === 0) {
    result = 'zero reais';
  }

  return result.charAt(0).toUpperCase() + result.slice(1);
}

/**
 * Formats date in Brazilian standard
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formats value as Brazilian currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

/**
 * Generates receipt HTML for printing
 */
export function generateReceiptHTML(data: ReceiptData): string {
  const formattedDate = formatDate(data.issueDate);
  const formattedAmount = formatCurrency(data.payment.amount);
  const amountWords = data.payment.amountInWords || valueInWords(data.payment.amount);

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recibo ${data.receiptNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    @page {
      size: A4;
      margin: 15mm;
    }
    
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #333;
      background: #fff;
    }
    
    .receipt-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      border: 2px solid #dc2626;
      border-radius: 8px;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #dc2626;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    
    .logo-area {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .logo {
      width: 80px;
      height: 80px;
      background: #dc2626;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24pt;
      font-weight: bold;
      border-radius: 8px;
    }
    
    .company-info h1 {
      color: #dc2626;
      font-size: 18pt;
      margin-bottom: 5px;
    }
    
    .company-info p {
      font-size: 10pt;
      color: #666;
    }
    
    .receipt-number {
      text-align: right;
    }
    
    .receipt-number .number {
      font-size: 16pt;
      font-weight: bold;
      color: #dc2626;
    }
    
    .receipt-number .date {
      font-size: 10pt;
      color: #666;
    }
    
    .receipt-title {
      text-align: center;
      background: #dc2626;
      color: white;
      padding: 10px;
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    
    .amount-highlight {
      text-align: center;
      margin-bottom: 20px;
      padding: 15px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 4px;
    }
    
    .amount-highlight .amount {
      font-size: 28pt;
      font-weight: bold;
      color: #dc2626;
    }
    
    .amount-highlight .words {
      font-size: 11pt;
      color: #666;
      font-style: italic;
      margin-top: 5px;
    }
    
    .section {
      margin-bottom: 20px;
    }
    
    .section-title {
      font-weight: bold;
      color: #dc2626;
      border-bottom: 1px solid #e5e5e5;
      padding-bottom: 5px;
      margin-bottom: 10px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 150px 1fr;
      gap: 8px;
    }
    
    .info-grid .label {
      font-weight: 600;
      color: #666;
    }
    
    .info-grid .value {
      color: #333;
    }
    
    .description-box {
      background: #f9fafb;
      border: 1px solid #e5e5e5;
      padding: 15px;
      border-radius: 4px;
      margin-top: 10px;
    }
    
    .notes-box {
      background: #fffbeb;
      border: 1px solid #fcd34d;
      padding: 10px;
      border-radius: 4px;
      font-size: 10pt;
      color: #854d0e;
    }
    
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 50px;
      padding-top: 20px;
    }
    
    .signature-box {
      text-align: center;
      width: 45%;
    }
    
    .signature-line {
      border-top: 1px solid #333;
      padding-top: 10px;
      margin-top: 50px;
    }
    
    .signature-label {
      font-size: 10pt;
      color: #666;
    }
    
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e5e5e5;
      text-align: center;
      font-size: 9pt;
      color: #999;
    }
    
    .footer p {
      margin-bottom: 5px;
    }
    
    /* Print styles */
    @media print {
      body {
        background: white;
      }
      
      .receipt-container {
        border: 2px solid #333;
        box-shadow: none;
      }
      
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <!-- Header -->
    <div class="header">
      <div class="logo-area">
        ${data.company.logo 
          ? `<img src="${data.company.logo}" alt="Logo" class="logo" style="background: transparent;">`
          : '<div class="logo">SM</div>'
        }
        <div class="company-info">
          <h1>${data.company.name}</h1>
          <p>CNPJ: ${data.company.companyTaxId}</p>
          <p>${data.company.address}</p>
          <p>${data.company.phone} | ${data.company.email}</p>
        </div>
      </div>
      <div class="receipt-number">
        <div class="number">Nº ${data.receiptNumber}</div>
        <div class="date">${formattedDate}</div>
      </div>
    </div>
    
    <!-- Title -->
    <div class="receipt-title">RECIBO DE PAGAMENTO</div>
    
    <!-- Amount Highlight -->
    <div class="amount-highlight">
      <div class="amount">${formattedAmount}</div>
      <div class="words">(${amountWords})</div>
    </div>
    
    <!-- Payer Data -->
    <div class="section">
      <div class="section-title">RECEBEMOS DE:</div>
      <div class="info-grid">
        <span class="label">Nome:</span>
        <span class="value">${data.payer.name}</span>
        <span class="label">CPF/CNPJ:</span>
        <span class="value">${data.payer.taxId}</span>
        ${data.payer.address ? `
          <span class="label">Endereço:</span>
          <span class="value">${data.payer.address}</span>
        ` : ''}
        ${data.payer.phone ? `
          <span class="label">Telefone:</span>
          <span class="value">${data.payer.phone}</span>
        ` : ''}
      </div>
    </div>
    
    <!-- Payment Data -->
    <div class="section">
      <div class="section-title">REFERENTE A:</div>
      <div class="info-grid">
        <span class="label">Referência:</span>
        <span class="value">${data.payment.reference}</span>
        <span class="label">Forma de Pagamento:</span>
        <span class="value">${data.payment.paymentMethod}</span>
        ${data.course ? `
          <span class="label">Curso:</span>
          <span class="value">${data.course.code} - ${data.course.name}</span>
        ` : ''}
        ${data.classInfo ? `
          <span class="label">Turma:</span>
          <span class="value">${data.classInfo.code} (${data.classInfo.period})</span>
        ` : ''}
      </div>
      <div class="description-box">
        ${data.payment.description}
      </div>
    </div>
    
    ${data.notes ? `
      <div class="section">
        <div class="notes-box">
          <strong>Observações:</strong> ${data.notes}
        </div>
      </div>
    ` : ''}
    
    <!-- Signatures -->
    <div class="signatures">
      <div class="signature-box">
        <div class="signature-line">
          <div class="signature-label">${data.company.name}</div>
          <div class="signature-label">CNPJ: ${data.company.companyTaxId}</div>
        </div>
      </div>
      <div class="signature-box">
        <div class="signature-line">
          <div class="signature-label">${data.payer.name}</div>
          <div class="signature-label">CPF/CNPJ: ${data.payer.taxId}</div>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>Este recibo é válido como comprovante de pagamento.</p>
      <p>Documento gerado eletronicamente pela Plataforma Caiso.</p>
      <p>Data de emissão: ${new Date().toLocaleString('pt-BR')}</p>
    </div>
  </div>
  
  <!-- Action buttons (hidden in print) -->
  <div class="no-print" style="text-align: center; margin-top: 20px;">
    <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer; background: #dc2626; color: white; border: none; border-radius: 4px; margin-right: 10px;">
      🖨️ Imprimir
    </button>
    <button onclick="window.close()" style="padding: 10px 20px; font-size: 14px; cursor: pointer; background: #666; color: white; border: none; border-radius: 4px;">
      ✖️ Fechar
    </button>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Opens print window with the receipt
 */
export function printReceipt(data: ReceiptData): void {
  const html = generateReceiptHTML(data);
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
  }
}

/**
 * Generates a unique receipt number
 */
export function generateReceiptNumber(): string {
  // Sem Math.random(): número determinístico baseado em timestamp + sequência em memória.
  // Observação: isso NÃO substitui um identificador oficial gerado pelo backend.
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const millis = date.getMilliseconds().toString().padStart(3, '0');

  receiptSequence = (receiptSequence + 1) % 1000;
  const seq = String(receiptSequence).padStart(3, '0');

  return `REC-${year}${month}${day}-${hours}${minutes}${seconds}${millis}-${seq}`;
}

let receiptSequence = 0;

/**
 * Example receipt data
 */
export function exampleReceipt(): ReceiptData {
  return {
    receiptNumber: generateReceiptNumber(),
    issueDate: new Date(),
    company: {
      name: 'Caiso Treinamentos',
      companyTaxId: '12.345.678/0001-90',
      address: 'Av. Paulista, 1000 - São Paulo/SP',
      phone: '(11) 3456-7890',
      email: 'contato@smcorp.com.br',
    },
    payer: {
      name: 'João da Silva',
      taxId: '123.456.789-00',
      address: 'Rua das Flores, 123 - Centro',
      phone: '(11) 98765-4321',
    },
    payment: {
      amount: 1250.00,
      amountInWords: valueInWords(1250.00),
      paymentMethod: 'PIX',
      reference: 'Matrícula #MAT2025001',
      description: 'Pagamento referente ao curso NR-35 - Trabalho em Altura, turma T2025-001.',
    },
    course: {
      name: 'NR-35 - Trabalho em Altura',
      code: 'NR35',
    },
    classInfo: {
      code: 'T2025-001',
      period: '10/02/2025 a 14/02/2025',
    },
    notes: 'Aluno confirmado para participação no curso.',
  };
}

// ============================================
// Legacy re-exports for backward compatibility
// TODO: Remove after full migration
// ============================================
/** @deprecated Use ReceiptData instead */
export type ReciboData = ReceiptData;
/** @deprecated Use valueInWords instead */
export const valorPorExtenso = valueInWords;
/** @deprecated Use formatDate instead */
export const formatarData = formatDate;
/** @deprecated Use formatCurrency instead */
export const formatarMoeda = formatCurrency;
/** @deprecated Use generateReceiptHTML instead */
export const gerarReciboHTML = generateReceiptHTML;
/** @deprecated Use printReceipt instead */
export const imprimirRecibo = printReceipt;
/** @deprecated Use generateReceiptNumber instead */
export const gerarNumeroRecibo = generateReceiptNumber;
/** @deprecated Use exampleReceipt instead */
export const exemploRecibo = exampleReceipt;
