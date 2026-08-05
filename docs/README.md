# 🏢 Plataforma SMCORP

## Sistema de Gestão para Centros de Treinamento Profissionalizante

![Version](https://img.shields.io/badge/version-2.5.2-red)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Vite](https://img.shields.io/badge/Vite-6.3.5-purple)
![Tailwind](https://img.shields.io/badge/Tailwind-4.1-cyan)

---

## 📋 Sobre o Projeto

A **Plataforma SMCORP** é um ecossistema completo de gestão desenvolvido especificamente para centros de treinamento profissionalizante, baseado na **lógica de Cascata de Dados** com identidade visual em **vermelho, branco e 10% cinza**.

### ✨ Principais Características

- 🎯 **9 Módulos Integrados** - Sistema completo de gestão
- 📊 **Dashboard Executivo** - Visão geral em tempo real
- 👥 **Gestão de Alunos** - 4 status (Agendado, Confirmar, Confirmado, Presente)
- 💰 **Sistema Financeiro Completo** - Lançamentos, custos e pagamentos
- 👨‍🏫 **Gestão de Instrutores** - Códigos automáticos (IN0001, IN0002...)
- 📝 **Agendamento de Provas** - Múltiplas formas de acesso
- 🔐 **Sistema de Permissões** - Controle granular por usuário
- 📄 **Gestão de Documentos** - Armazenamento e controle
- 🏢 **Precificações por Empresa** - Múltiplas tabelas
- 🔄 **Substituição e Transferência** - Gestão de mudanças de alunos

---

## 🚀 Começando

### Pré-requisitos

- Node.js 18+ instalado
- npm ou pnpm

### Instalação

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/smcorp.git

# Entrar na pasta
cd smcorp

# Instalar dependências
npm install

# Iniciar em modo desenvolvimento
npm run dev
```

O sistema estará disponível em: `http://localhost:5173`

---

## 📦 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview
```

---

## 🌐 Deploy / Publicação

**Veja guias completos de deploy:**

- 📖 [**COMO-PUBLICAR.md**](./COMO-PUBLICAR.md) - Guia rápido (5 minutos)
- 📚 [**README-DEPLOY.md**](./README-DEPLOY.md) - Guia completo com todas opções

### Deploy Rápido (Vercel - Recomendado)

```bash
# Usando script automático
chmod +x deploy.sh
./deploy.sh vercel
```

---

## 🏗️ Arquitetura

### Estrutura de Pastas

```
smcorp/
├── src/
│   ├── app/
│   │   ├── components/      # Componentes React
│   │   ├── contexts/        # Context API (Estado global)
│   │   ├── hooks/           # Custom hooks
│   │   └── utils/           # Utilitários
│   └── styles/              # Estilos CSS
├── public/                  # Assets estáticos
└── [arquivos de config]
```

### Tecnologias Principais

- **React 18** - Framework UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **Tailwind CSS v4** - Estilização
- **Radix UI** - Componentes acessíveis
- **Lucide React** - Ícones
- **Sonner** - Toasts/Notificações
- **jsPDF** - Geração de PDFs

---

## 💾 Armazenamento de Dados

⚠️ **IMPORTANTE:** A versão atual usa **localStorage** para armazenar dados.

### Características:

- ✅ Não precisa de backend/servidor
- ✅ Rápido e simples
- ✅ Funciona offline
- ⚠️ Dados ficam apenas no navegador
- ⚠️ Não sincroniza entre dispositivos
- ⚠️ Limpar cache = perder dados

### Para Produção com Múltiplos Usuários:

Recomendamos integrar com banco de dados:
- **Supabase** (recomendado) - https://supabase.com
- **Firebase** - https://firebase.google.com
- **Backend próprio** (Node.js + PostgreSQL)

---

## 📊 Módulos do Sistema

### Módulo 00 - Dashboard Executivo
Visão geral com métricas e indicadores em tempo real

### Módulo 01 - Configurações
Dados institucionais, usuários e permissões

### Módulo 02 - Gestão de Empresas
Cadastro e gestão de empresas clientes

### Módulo 03 - Cadastro de Alunos
Matrícula e gestão de alunos individuais

### Módulo 04 - Importação em Lote
Importação de alunos via planilha Excel

### Módulo 05 - Gestão de Salas
Cadastro e controle de salas de treinamento

### Módulo 06 - Gestão de Turmas
Criação e gerenciamento de turmas

### Módulo 07 - Calendário de Provas
Agendamento e controle de avaliações

### Módulo 08 - Financeiro
Lançamentos, custos e pagamentos

### Módulo 09 - Instrutores
Gestão completa de instrutores e custos

---

## 🎨 Identidade Visual

- **Cor Primária:** Vermelho (#DC2626)
- **Cor Secundária:** Branco (#FFFFFF)
- **Cor Terciária:** Cinza (10% de uso)

---

## 🔒 Sistema de Permissões

Controle granular por módulo e ação:
- Visualizar
- Criar
- Editar
- Excluir
- Aprovar pagamentos
- Gerenciar custos

---

## 🐛 Correções Recentes

### v2.5.2 - Janeiro 2026
- ✅ **FIX CRÍTICO:** Corrigido bug de códigos duplicados em lançamentos automáticos
- ✅ **Race condition resolvida** em `dispararCustosAutomaticos`
- ✅ **Códigos sequenciais garantidos** (L0028, L0029, L0030...)

---

## 📝 Licença

Este projeto é proprietário e confidencial.

---

## 🤝 Suporte

Para dúvidas ou problemas:
1. Verifique logs do console (F12 no navegador)
2. Revise documentação de deploy
3. Entre em contato com o time de desenvolvimento

---

## 🎯 Roadmap

- [ ] Integração com Supabase
- [ ] App mobile (React Native)
- [ ] Relatórios avançados
- [ ] Integração com sistemas de pagamento
- [ ] API REST para integrações externas
- [ ] Sistema de notificações por WhatsApp/Email

---

**Desenvolvido com ❤️ para centros de treinamento profissionalizante**
