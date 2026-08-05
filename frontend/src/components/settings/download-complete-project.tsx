'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, FileCode, Package } from 'lucide-react';
import { toast } from 'sonner';

// ============================================
// Constants
// ============================================

const DOCUMENTATION_FILES = [
  'DEPLOY_RAPIDO.md',
  'COMANDOS_COPIAR_COLAR.md',
  'GUIA_VISUAL_DEPLOY.md',
  'EXPORTAR_ARQUIVOS.md',
  'LISTA_ARQUIVOS_TSX.md',
  'INDICE_DOCUMENTACAO_DEPLOY.md',
  'COMO-PUBLICAR.md',
] as const;

const CONFIG_FILES = [
  'package.json',
  'next.config.js',
  'tsconfig.json',
  'tailwind.config.ts',
  'postcss.config.js',
] as const;

const DOWNLOAD_MANIFEST = [
  { name: 'DEPLOY_RAPIDO.md', description: 'Deploy em 3 minutos' },
  { name: 'GUIA_VISUAL_DEPLOY.md', description: 'Tutorial completo' },
  { name: 'COMANDOS_COPIAR_COLAR.md', description: 'Comandos prontos' },
  { name: 'LISTA_ARQUIVOS_TSX.md', description: 'Arquivos listados' },
  { name: 'EXPORTAR_ARQUIVOS.md', description: 'Como exportar' },
  { name: 'package.json', description: 'Dependências do projeto' },
  { name: 'next.config.js', description: 'Configuração Next.js' },
  { name: 'tsconfig.json', description: 'Configuração TypeScript' },
  { name: 'README.md', description: 'Instruções completas' },
] as const;

// ============================================
// Helpers
// ============================================

async function fetchFileContent(path: string): Promise<string> {
  try {
    const response = await fetch(`/${path}`);
    if (!response.ok) return '';
    return await response.text();
  } catch {
    return '';
  }
}

function generateInstallInstructions(): string {
  return `# INSTRUÇÕES DE INSTALAÇÃO

## IMPORTANTE: BAIXAR CÓDIGO-FONTE COMPLETO

Este arquivo ZIP contém apenas a documentação e configurações.

Para obter o código-fonte completo (.tsx, .ts, etc.), você precisa:

---

## OPÇÃO 1: Clonar do GitHub

Se o projeto já está no GitHub:

\`\`\`bash
git clone https://github.com/SEU-USUARIO/smcorp-platform.git
cd smcorp-platform
npm install
npm run dev
\`\`\`

---

## OPÇÃO 2: Criar Manualmente

1. Crie uma pasta para o projeto
2. Copie todos os arquivos do repositório
3. Coloque os arquivos deste ZIP na raiz
4. Execute: \`npm install\`
5. Execute: \`npm run dev\`

---

## ESTRUTURA NECESSÁRIA

Você precisa ter estas pastas/arquivos:

\`\`\`
smcorp-platform/
├── src/                    ← CÓDIGO-FONTE (necessário!)
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── ...
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── stores/
│   └── types/
├── public/
├── package.json            ← Já incluído
├── next.config.js          ← Já incluído
├── tsconfig.json           ← Já incluído
└── tailwind.config.ts      ← Já incluído
\`\`\`

---

## APÓS OBTER O CÓDIGO COMPLETO

\`\`\`bash
# 1. Instalar dependências
npm install

# 2. Executar em desenvolvimento
npm run dev

# 3. Abrir navegador
# http://localhost:3000
\`\`\`

---

## DOCUMENTAÇÃO

Leia os arquivos .md incluídos neste ZIP:

- **DEPLOY_RAPIDO.md** - Como fazer deploy
- **GUIA_VISUAL_DEPLOY.md** - Tutorial completo
- **LISTA_ARQUIVOS_TSX.md** - Arquivos listados

---

Dúvidas? Consulte INDICE_DOCUMENTACAO_DEPLOY.md
`;
}

function generateReadme(): string {
  return `# PLATAFORMA SMCORP

## Download Realizado com Sucesso!

Este é o pacote de documentação da Plataforma SMCORP.

---

## Início Rápido

### 1. Instalar Dependências

\`\`\`bash
npm install
\`\`\`

### 2. Executar Localmente

\`\`\`bash
npm run dev
\`\`\`

Acesse: http://localhost:3000

### 3. Build para Produção

\`\`\`bash
npm run build
npm start
\`\`\`

---

## Tecnologias Utilizadas

- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **Zustand** - Gerenciamento de estado
- **Prisma** - ORM
- **NestJS** - Backend API

---

## Documentação Incluída

- DEPLOY_RAPIDO.md - Como fazer deploy
- GUIA_VISUAL_DEPLOY.md - Tutorial completo
- COMANDOS_COPIAR_COLAR.md - Comandos prontos
- LISTA_ARQUIVOS_TSX.md - Lista de todos os arquivos
- EXPORTAR_ARQUIVOS.md - Como exportar

---

© ${new Date().getFullYear()} SMCORP - Sistema de Gestão para Centros de Treinamento
`;
}

// ============================================
// Component
// ============================================

export const DownloadCompleteProject: React.FC = () => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    toast.info('Preparando download do projeto completo...');

    try {
      const JSZip = (await import('jszip')).default;
      const { saveAs } = await import('file-saver');

      const zip = new JSZip();

      // Fetch documentation files
      const docPromises = DOCUMENTATION_FILES.map(async (name) => {
        const content = await fetchFileContent(name);
        if (content) zip.file(name, content);
      });

      // Fetch config files
      const configPromises = CONFIG_FILES.map(async (name) => {
        const content = await fetchFileContent(name);
        if (content) zip.file(name, content);
      });

      await Promise.all([...docPromises, ...configPromises]);

      // Add generated README
      zip.file('README.md', generateReadme());

      // Add installation instructions
      zip.file('INSTRUCOES_INSTALACAO.txt', generateInstallInstructions());

      // Fetch deploy script
      const deployScript = await fetchFileContent('COMANDOS_DEPLOY.sh');
      if (deployScript) {
        zip.file('COMANDOS_DEPLOY.sh', deployScript);
      }

      // Generate ZIP
      const blob = await zip.generateAsync({ type: 'blob' });
      const currentDate = new Date().toISOString().split('T')[0];
      saveAs(blob, `smcorp-documentacao-${currentDate}.zip`);

      toast.success('Download concluído!', {
        description: 'Documentação completa baixada com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao gerar ZIP:', error);
      toast.error('Erro ao gerar download', {
        description: 'Verifique se as dependências jszip e file-saver estão instaladas.',
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500 text-white rounded-lg">
            <Package className="w-6 h-6" />
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-lg mb-2">Download do Projeto SMCORP</h3>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Baixe toda a documentação de deploy, guias completos e arquivos de configuração do projeto.
            </p>

            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 mb-4 border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <FileCode className="w-4 h-4" />O que será baixado:
              </h4>
              <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                {DOWNLOAD_MANIFEST.map(({ name, description }) => (
                  <li key={name}>
                    <strong>{name}</strong> — {description}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                <strong>Importante:</strong> Este download contém a documentação completa e arquivos de configuração.
                Para o código-fonte completo, use git clone ou exporte o projeto pelo repositório.
              </p>
            </div>

            <Button
              onClick={handleDownload}
              disabled={downloading}
              size="lg"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Gerando arquivo ZIP...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Baixar Documentação Completa (.zip)
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 mt-2">Arquivo: ~50-100 KB (apenas documentação)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
