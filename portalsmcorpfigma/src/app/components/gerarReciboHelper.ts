// Helper para gerar recibo de Pessoa Física

// Logo SVG inline (substitui figma:asset que não funciona em produção)
const logoSMCORP = 'data:image/svg+xml;base64,' + btoa(`
<svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#DC2626;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#991B1B;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="200" height="60" fill="url(#grad)" rx="8"/>
  <text x="100" y="30" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">SMCORP</text>
  <text x="100" y="48" font-family="Arial, sans-serif" font-size="10" fill="white" text-anchor="middle" opacity="0.9">Treinamentos Profissionalizantes</text>
</svg>
`);

interface GerarReciboParams {
  numeroRecibo: string;
  alunoNome: string;
  alunoCPF: string;
  valor: number;
  nomeProduto: string;
  logoBase64?: string; // 🆕 Logo em base64 para incorporar no HTML
}

export const gerarHTMLRecibo = (params: GerarReciboParams): string => {
  const { numeroRecibo, alunoNome, alunoCPF, valor, nomeProduto, logoBase64 } = params;

  // Formatar valor por extenso
  const formatarValorPorExtenso = (valor: number): string => {
    const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
    
    const valorInteiro = Math.floor(valor);
    const centavos = Math.round((valor - valorInteiro) * 100);
    
    const converterNumero = (num: number): string => {
      if (num === 0) return 'zero';
      if (num === 100) return 'cem';
      let resultado = '';
      const c = Math.floor(num / 100);
      const resto = num % 100;
      if (c > 0) {
        resultado += centenas[c];
        if (resto > 0) resultado += ' e ';
      }
      if (resto >= 10 && resto < 20) {
        resultado += especiais[resto - 10];
      } else {
        const d = Math.floor(resto / 10);
        const u = resto % 10;
        if (d > 0) {
          resultado += dezenas[d];
          if (u > 0) resultado += ' e ';
        }
        if (u > 0) {
          resultado += unidades[u];
        }
      }
      return resultado;
    };
    
    let extenso = '';
    const milhares = Math.floor(valorInteiro / 1000);
    const restoValor = valorInteiro % 1000;
    
    if (milhares > 0) {
      extenso = milhares === 1 ? 'mil' : converterNumero(milhares) + ' mil';
      if (restoValor > 0) extenso += restoValor < 100 ? ' e ' : ' ';
    }
    
    if (restoValor > 0) extenso += converterNumero(restoValor);
    
    extenso += valorInteiro === 1 ? ' real' : ' reais';
    
    if (centavos > 0) {
      extenso += ' e ' + converterNumero(centavos);
      extenso += centavos === 1 ? ' centavo' : ' centavos';
    }
    
    return extenso.charAt(0).toUpperCase() + extenso.slice(1);
  };

  // Formatar data por extenso
  const formatarDataPorExtenso = (): string => {
    const hoje = new Date();
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return `${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`;
  };

  const valorFormatado = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const valorExtenso = formatarValorPorExtenso(valor);
  const dataExtenso = formatarDataPorExtenso();

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recibo ${numeroRecibo}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; }
      .no-print { display: none; }
    }
    
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      padding: 0;
      background: white;
    }
    
    .recibo-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      border: 4px double #000;
      border-radius: 15px;
      position: relative;
      background: white;
    }
    
    .recibo-container::before {
      content: '';
      position: absolute;
      top: 8px;
      left: 8px;
      right: 8px;
      bottom: 8px;
      border: 2px solid #000;
      border-radius: 10px;
      pointer-events: none;
    }
    
    .cabecalho {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 15px 20px;
      border: 3px solid #000;
      border-radius: 8px;
      margin-bottom: 30px;
      background: white;
    }
    
    .cabecalho-titulo {
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 2px;
    }
    
    .logo-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .logo-smcorp {
      height: 50px;
      width: auto;
      object-fit: contain;
    }
    
    .cabecalho-info {
      text-align: right;
    }
    
    .numero-recibo {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .valor-recibo {
      font-size: 18px;
      font-weight: bold;
    }
    
    .corpo-recibo {
      padding: 0 20px;
      line-height: 2.5;
      font-size: 16px;
    }
    
    .campo {
      margin: 15px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #000;
    }
    
    .label {
      display: inline-block;
      min-width: 150px;
      font-weight: normal;
    }
    
    .valor-campo {
      font-weight: bold;
      margin-left: 10px;
    }
    
    .campo-texto {
      margin: 25px 0;
    }
    
    .assinatura-section {
      margin-top: 50px;
      padding: 0 20px;
    }
    
    .assinatura {
      margin-top: 80px;
      padding-top: 2px;
      border-top: 2px solid #000;
      width: 100%;
      font-size: 14px;
    }
    
    .rodape {
      margin-top: 40px;
      text-align: right;
      padding: 0 20px;
      font-weight: bold;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .btn-imprimir {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .btn-imprimir:hover {
      background: #b91c1c;
    }
  </style>
</head>
<body>
  <button class="btn-imprimir no-print" onclick="window.print()">🖨️ Imprimir</button>
  
  <div class="recibo-container">
    <div class="cabecalho">
      <div class="cabecalho-titulo">RECIBO</div>
      <div class="logo-container">
        <img src="${logoBase64 ? logoBase64 : logoSMCORP}" alt="SMCORP Treinamentos" class="logo-smcorp" />
      </div>
      <div class="cabecalho-info">
        <div class="numero-recibo">Nº: ${numeroRecibo}</div>
        <div class="valor-recibo">VALOR: ${valorFormatado} -</div>
      </div>
    </div>
    
    <div class="corpo-recibo">
      <div class="campo">
        <span class="label">Recebe(emos) de</span>
        <span class="valor-campo">${alunoNome} (CPF ${alunoCPF})</span>
      </div>
      
      <div class="campo">
        <span class="label">a importância de</span>
        <span class="valor-campo">${valorExtenso}</span>
      </div>
      
      <div class="campo">
        <span class="label">referente a</span>
        <span class="valor-campo">${nomeProduto}</span>
      </div>
      
      <div class="campo-texto">
        e para clareza firmo(amos) o presente
      </div>
      
      <div style="text-align: right; margin-top: 40px; padding-right: 20px;">
        <strong>Macaé</strong>, ${dataExtenso}
      </div>
      
      <div class="assinatura-section">
        <div class="assinatura">Assinatura:</div>
      </div>
    </div>
    
    <div class="rodape">
      <div>SMCORP Treinamento LTDA</div>
      <div>13.036.648/0001-60</div>
    </div>
  </div>
</body>
</html>
  `;
};