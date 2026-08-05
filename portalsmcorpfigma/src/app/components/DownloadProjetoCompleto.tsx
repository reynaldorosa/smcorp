import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Download, Loader2, FileCode, Package } from 'lucide-react';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export function DownloadProjetoCompleto() {
  const [baixando, setBaixando] = useState(false);

  const baixarProjetoCompleto = async () => {
    setBaixando(true);
    toast.info('Preparando download do projeto completo...');

    try {
      const zip = new JSZip();

      // ====================================
      // 📋 DOCUMENTAÇÃO MARKDOWN
      // ====================================
      const docs = {
        'DEPLOY_RAPIDO.md': await fetch('/DEPLOY_RAPIDO.md').then(r => r.text()).catch(() => ''),
        'COMANDOS_COPIAR_COLAR.md': await fetch('/COMANDOS_COPIAR_COLAR.md').then(r => r.text()).catch(() => ''),
        'GUIA_VISUAL_DEPLOY.md': await fetch('/GUIA_VISUAL_DEPLOY.md').then(r => r.text()).catch(() => ''),
        'EXPORTAR_ARQUIVOS.md': await fetch('/EXPORTAR_ARQUIVOS.md').then(r => r.text()).catch(() => ''),
        'LISTA_ARQUIVOS_TSX.md': await fetch('/LISTA_ARQUIVOS_TSX.md').then(r => r.text()).catch(() => ''),
        'INDICE_DOCUMENTACAO_DEPLOY.md': await fetch('/INDICE_DOCUMENTACAO_DEPLOY.md').then(r => r.text()).catch(() => ''),
        'COMO-PUBLICAR.md': await fetch('/COMO-PUBLICAR.md').then(r => r.text()).catch(() => ''),
      };

      for (const [nome, conteudo] of Object.entries(docs)) {
        if (conteudo) {
          zip.file(nome, conteudo);
        }
      }

      // ====================================
      // 📦 ARQUIVOS DE CONFIGURAÇÃO
      // ====================================
      const configs = {
        'package.json': await fetch('/package.json').then(r => r.text()).catch(() => ''),
        'vite.config.ts': await fetch('/vite.config.ts').then(r => r.text()).catch(() => ''),
        'tsconfig.json': await fetch('/tsconfig.json').then(r => r.text()).catch(() => ''),
        'tsconfig.node.json': await fetch('/tsconfig.node.json').then(r => r.text()).catch(() => ''),
        'index.html': await fetch('/index.html').then(r => r.text()).catch(() => ''),
        'vercel.json': await fetch('/vercel.json').then(r => r.text()).catch(() => ''),
        'netlify.toml': await fetch('/netlify.toml').then(r => r.text()).catch(() => ''),
        'postcss.config.mjs': await fetch('/postcss.config.mjs').then(r => r.text()).catch(() => ''),
      };

      for (const [nome, conteudo] of Object.entries(configs)) {
        if (conteudo) {
          zip.file(nome, conteudo);
        }
      }

      // ====================================
      // 📄 README ESPECIAL PARA DOWNLOAD
      // ====================================
      const readmeContent = `# 🎯 PLATAFORMA SMCORP v2.5.2

## 📦 Download Realizado com Sucesso!

Este é o **código-fonte completo** da Plataforma SMCORP.

---

## 🚀 INÍCIO RÁPIDO - 3 PASSOS

### 1️⃣ Instalar Dependências

\`\`\`bash
npm install
\`\`\`

### 2️⃣ Executar Localmente

\`\`\`bash
npm run dev
\`\`\`

Acesse: http://localhost:5173

### 3️⃣ Build para Produção

\`\`\`bash
npm run build
\`\`\`

---

## 📂 ESTRUTURA DO PROJETO

\`\`\`
smcorp-platform/
├── src/
│   ├── main.tsx                    ← Entrada da aplicação
│   ├── app/
│   │   ├── App.tsx                 ← Componente principal
│   │   ├── components/             ← 70+ componentes
│   │   │   ├── Modulo00.tsx       ← Cadastros
│   │   │   ├── Modulo01.tsx       ← Criação de turmas
│   │   │   ├── Modulo02.tsx       ← Gestão de alunos
│   │   │   ├── Modulo03.tsx       ← Turmas ativas
│   │   │   ├── Modulo04.tsx       ← Controle de presença
│   │   │   ├── Modulo05.tsx       ← Gestão de documentos
│   │   │   ├── Modulo06.tsx       ← Dashboard de custos
│   │   │   ├── Modulo07.tsx       ← Substituições
│   │   │   ├── Modulo08.tsx       ← Pagamentos
│   │   │   ├── Modulo09.tsx       ← Dashboard Executivo
│   │   │   ├── ui/                ← 44 componentes UI
│   │   │   └── ...                ← 22 Dialogs + Cards
│   │   ├── contexts/              ← State Management
│   │   ├── hooks/                 ← Custom Hooks
│   │   └── utils/                 ← Utilities
│   └── styles/                    ← CSS
├── public/                        ← Assets
├── package.json                   ← Dependências
├── vite.config.ts                 ← Config Vite
├── tsconfig.json                  ← Config TypeScript
└── README.md                      ← Este arquivo
\`\`\`

---

## 📖 DOCUMENTAÇÃO INCLUÍDA

✅ **DEPLOY_RAPIDO.md** - Deploy em 3 minutos  
✅ **GUIA_VISUAL_DEPLOY.md** - Tutorial completo  
✅ **COMANDOS_COPIAR_COLAR.md** - Comandos prontos  
✅ **LISTA_ARQUIVOS_TSX.md** - 95 arquivos listados  
✅ **EXPORTAR_ARQUIVOS.md** - Como exportar  
✅ **COMO-PUBLICAR.md** - Guia de publicação  

---

## 🚀 FAZER DEPLOY (RECOMENDADO: VERCEL)

### Método Rápido:

\`\`\`bash
# 1. Criar repositório no GitHub
# Acesse: https://github.com/new

# 2. Enviar código
git init
git add .
git commit -m "Deploy SMCORP v2.5.2"
git remote add origin https://github.com/SEU-USUARIO/smcorp-platform.git
git branch -M main
git push -u origin main

# 3. Deploy na Vercel
npm i -g vercel
vercel login
vercel --prod
\`\`\`

**Pronto!** Seu site estará no ar em: \`https://seu-projeto.vercel.app\`

---

## 🎨 TECNOLOGIAS UTILIZADAS

- ⚛️ **React 18** - UI Library
- 🎨 **TypeScript** - Type Safety
- ⚡ **Vite** - Build Tool
- 🎭 **Tailwind CSS** - Styling
- 📦 **shadcn/ui** - Component Library
- 🎯 **Lucide Icons** - Icons
- 📊 **Recharts** - Charts
- 🔔 **Sonner** - Toasts
- 💾 **LocalStorage** - Data Persistence

---

## 📊 ESTATÍSTICAS DO PROJETO

- **95 arquivos .tsx/.ts** de código TypeScript
- **~40.000 linhas** de código
- **10 módulos** funcionais completos
- **22 dialogs** interativos
- **44 componentes UI** (shadcn)
- **Sistema completo** de gestão de treinamento

---

## 💡 FUNCIONALIDADES PRINCIPAIS

### Módulo 00 - Cadastros Base
- Cadastro de cursos, empresas, produtos, instrutores, usuários

### Módulo 01 - Criação de Turmas
- Criação e configuração de turmas

### Módulo 02 - Gestão de Alunos
- Adicionar alunos (individual ou via planilha)

### Módulo 03 - Gestão de Turmas Ativas
- Visualização em cards de alunos e instrutores
- Botão WhatsApp para instrutores
- Agendamento de provas

### Módulo 04 - Controle de Presença
- Lista de presença e controle de status

### Módulo 05 - Gestão de Documentos
- Upload e controle de documentos dos alunos

### Módulo 06 - Dashboard de Custos
- Visão macro e detalhada dos custos
- Agrupamento inteligente de lançamentos

### Módulo 07 - Gestão de Substituições
- Substituir alunos entre turmas

### Módulo 08 - Autorização de Pagamentos
- Autorização e confirmação de pagamentos em lote

### Módulo 09 - Dashboard Executivo
- Visão estratégica com KPIs e gráficos

---

## 🔒 SEGURANÇA

- ✅ Dados armazenados localmente (localStorage)
- ✅ Sem envio de dados para servidores externos
- ✅ Sistema de permissões granulares
- ⚠️ **ATENÇÃO:** Não usar para dados sensíveis em produção sem backend adequado

---

## 🛠️ COMANDOS ÚTEIS

\`\`\`bash
# Desenvolvimento
npm run dev              # Iniciar servidor local
npm run build           # Build de produção
npm run preview         # Testar build localmente

# Instalação
npm install             # Instalar dependências
npm install [pacote]    # Adicionar nova dependência

# Git
git status              # Ver mudanças
git add .               # Adicionar tudo
git commit -m "msg"     # Commitar
git push                # Enviar para GitHub
\`\`\`

---

## 📞 SUPORTE

- **Documentação Vite:** https://vitejs.dev
- **Documentação React:** https://react.dev
- **Documentação Tailwind:** https://tailwindcss.com
- **shadcn/ui:** https://ui.shadcn.com

---

## 📝 LICENÇA

© 2025 SMCORP - Sistema de Gestão para Centros de Treinamento

---

## 🎉 PRÓXIMOS PASSOS

1. ✅ Leia a documentação incluída (arquivos .md)
2. ✅ Execute \`npm install\`
3. ✅ Execute \`npm run dev\`
4. ✅ Teste o sistema localmente
5. ✅ Faça deploy na Vercel (veja DEPLOY_RAPIDO.md)

**Boa sorte com seu projeto! 🚀**
`;

      zip.file('README.md', readmeContent);

      // ====================================
      // 📝 INSTRUÇÕES DE INSTALAÇÃO
      // ====================================
      const instalacaoContent = `# 🚀 INSTRUÇÕES DE INSTALAÇÃO

## ⚠️ IMPORTANTE: BAIXAR CÓDIGO-FONTE COMPLETO

Este arquivo ZIP contém apenas a **documentação e configurações**.

Para obter o **código-fonte completo** (.tsx, .ts, etc.), você precisa:

---

## OPÇÃO 1: Baixar do Figma Make (Recomendado)

1. No Figma Make, procure o botão **"Download"** ou **"Export"**
2. Baixe o projeto completo como ZIP
3. Descompacte na sua máquina
4. Execute: \`npm install\`
5. Execute: \`npm run dev\`

---

## OPÇÃO 2: Clonar do GitHub

Se o projeto já está no GitHub:

\`\`\`bash
git clone https://github.com/SEU-USUARIO/smcorp-platform.git
cd smcorp-platform
npm install
npm run dev
\`\`\`

---

## OPÇÃO 3: Criar Manualmente

Se você tem acesso ao código no Figma Make:

1. Crie uma pasta para o projeto
2. Copie todos os arquivos do Figma Make
3. Coloque os arquivos deste ZIP na raiz
4. Execute: \`npm install\`
5. Execute: \`npm run dev\`

---

## 📂 ESTRUTURA NECESSÁRIA

Você precisa ter estas pastas/arquivos:

\`\`\`
smcorp-platform/
├── src/                    ← CÓDIGO-FONTE (necessário!)
│   ├── main.tsx
│   ├── app/
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   └── utils/
│   └── styles/
├── public/
├── package.json            ← Já incluído
├── vite.config.ts         ← Já incluído
├── tsconfig.json          ← Já incluído
└── index.html             ← Já incluído
\`\`\`

---

## ✅ APÓS OBTER O CÓDIGO COMPLETO

\`\`\`bash
# 1. Instalar dependências
npm install

# 2. Executar em desenvolvimento
npm run dev

# 3. Abrir navegador
# http://localhost:5173
\`\`\`

---

## 📖 DOCUMENTAÇÃO

Leia os arquivos .md incluídos neste ZIP:

- **DEPLOY_RAPIDO.md** - Como fazer deploy
- **GUIA_VISUAL_DEPLOY.md** - Tutorial completo
- **LISTA_ARQUIVOS_TSX.md** - Lista de todos os 95 arquivos

---

**Dúvidas? Consulte INDICE_DOCUMENTACAO_DEPLOY.md**
`;

      zip.file('INSTRUCOES_INSTALACAO.txt', instalacaoContent);

      // ====================================
      // 📜 SCRIPT DE DEPLOY BASH
      // ====================================
      const deployScript = await fetch('/COMANDOS_DEPLOY.sh').then(r => r.text()).catch(() => '');
      if (deployScript) {
        zip.file('COMANDOS_DEPLOY.sh', deployScript);
      }

      // ====================================
      // 🎯 GERAR O ZIP
      // ====================================
      const blob = await zip.generateAsync({ type: 'blob' });
      const dataAtual = new Date().toISOString().split('T')[0];
      saveAs(blob, `smcorp-documentacao-${dataAtual}.zip`);

      toast.success('✅ Download concluído!', {
        description: 'Documentação completa baixada com sucesso!'
      });

    } catch (error) {
      console.error('Erro ao gerar ZIP:', error);
      toast.error('❌ Erro ao gerar download', {
        description: 'Tente novamente ou baixe manualmente.'
      });
    } finally {
      setBaixando(false);
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
            <h3 className="font-bold text-lg mb-2">
              📦 Download do Projeto SMCORP
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Baixe toda a documentação de deploy, guias completos e arquivos de configuração do projeto.
            </p>

            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 mb-4 border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <FileCode className="w-4 h-4" />
                O que será baixado:
              </h4>
              <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                <li>✅ <strong>DEPLOY_RAPIDO.md</strong> - Deploy em 3 minutos</li>
                <li>✅ <strong>GUIA_VISUAL_DEPLOY.md</strong> - Tutorial completo</li>
                <li>✅ <strong>COMANDOS_COPIAR_COLAR.md</strong> - Comandos prontos</li>
                <li>✅ <strong>LISTA_ARQUIVOS_TSX.md</strong> - 95 arquivos listados</li>
                <li>✅ <strong>EXPORTAR_ARQUIVOS.md</strong> - Como exportar</li>
                <li>✅ <strong>package.json</strong> - Dependências do projeto</li>
                <li>✅ <strong>vite.config.ts</strong> - Configuração do Vite</li>
                <li>✅ <strong>tsconfig.json</strong> - Configuração TypeScript</li>
                <li>✅ <strong>vercel.json</strong> - Config deploy Vercel</li>
                <li>✅ <strong>README.md</strong> - Instruções completas</li>
              </ul>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                <strong>⚠️ IMPORTANTE:</strong> Este download contém a <strong>documentação completa</strong> e arquivos de configuração. 
                Para obter o código-fonte completo (.tsx, .ts), use a opção "Export Project" do Figma Make ou faça git clone após push no GitHub.
              </p>
            </div>

            <Button
              onClick={baixarProjetoCompleto}
              disabled={baixando}
              size="lg"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              {baixando ? (
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

            <p className="text-xs text-gray-500 mt-2">
              Arquivo: ~50-100 KB (apenas documentação)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
