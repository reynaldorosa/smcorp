#!/bin/bash

# ========================================
# 🚀 SCRIPT DE DEPLOY AUTOMÁTICO - SMCORP
# ========================================
# Versão: 2.5.2
# Autor: Sistema SMCORP
# Data: 2025
# ========================================

echo "🎯 INICIANDO DEPLOY DA PLATAFORMA SMCORP..."
echo ""

# ========================================
# MÉTODO 1: GITHUB + VERCEL (RECOMENDADO)
# ========================================

deploy_github_vercel() {
    echo "📦 MÉTODO 1: GitHub + Vercel"
    echo "================================"
    echo ""
    
    # Verificar se Git está instalado
    if ! command -v git &> /dev/null; then
        echo "❌ Git não está instalado!"
        echo "📥 Instale em: https://git-scm.com/downloads"
        return 1
    fi
    
    # Inicializar repositório Git (se necessário)
    if [ ! -d .git ]; then
        echo "🔧 Inicializando repositório Git..."
        git init
        echo "✅ Git inicializado"
    else
        echo "✅ Repositório Git já existe"
    fi
    
    # Adicionar todos os arquivos
    echo "📁 Adicionando arquivos..."
    git add .
    
    # Fazer commit
    echo "💾 Fazendo commit..."
    git commit -m "Deploy: Plataforma SMCORP v2.5.2"
    
    echo ""
    echo "================================"
    echo "📋 PRÓXIMOS PASSOS MANUAIS:"
    echo "================================"
    echo ""
    echo "1️⃣  Criar repositório no GitHub:"
    echo "    https://github.com/new"
    echo ""
    echo "2️⃣  Conectar ao repositório (substitua SEU-USUARIO):"
    echo "    git remote add origin https://github.com/SEU-USUARIO/smcorp-platform.git"
    echo "    git branch -M main"
    echo "    git push -u origin main"
    echo ""
    echo "3️⃣  Deploy na Vercel:"
    echo "    npm i -g vercel"
    echo "    vercel login"
    echo "    vercel --prod"
    echo ""
    echo "✅ Pronto! Seu site estará no ar em minutos!"
    echo ""
}

# ========================================
# MÉTODO 2: BUILD LOCAL
# ========================================

build_local() {
    echo "🏗️  MÉTODO 2: Build Local"
    echo "================================"
    echo ""
    
    # Verificar se Node.js está instalado
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js não está instalado!"
        echo "📥 Instale em: https://nodejs.org/"
        return 1
    fi
    
    echo "📦 Instalando dependências..."
    npm install
    
    echo "🏗️  Fazendo build..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Build concluído com sucesso!"
        echo "📂 Arquivos gerados em: ./dist/"
        echo ""
        echo "🚀 Para testar localmente:"
        echo "   npm run preview"
        echo ""
        echo "📤 Para fazer upload:"
        echo "   1. Envie a pasta 'dist/' para seu servidor"
        echo "   2. Configure o servidor para servir index.html"
        echo ""
    else
        echo "❌ Erro no build!"
        return 1
    fi
}

# ========================================
# MÉTODO 3: CRIAR ZIP
# ========================================

criar_zip() {
    echo "📦 MÉTODO 3: Criar arquivo ZIP"
    echo "================================"
    echo ""
    
    ARQUIVO="smcorp-$(date +%Y%m%d-%H%M%S).zip"
    
    echo "🗜️  Criando arquivo: $ARQUIVO"
    echo ""
    
    if command -v zip &> /dev/null; then
        # Criar ZIP excluindo node_modules e outras pastas
        zip -r "$ARQUIVO" . \
            -x "node_modules/*" \
            -x "dist/*" \
            -x ".git/*" \
            -x "*.log" \
            -x ".vscode/*" \
            -x ".idea/*"
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Arquivo criado com sucesso!"
            echo "📦 Arquivo: $ARQUIVO"
            echo "📊 Tamanho: $(du -h "$ARQUIVO" | cut -f1)"
            echo ""
        else
            echo "❌ Erro ao criar ZIP!"
            return 1
        fi
    else
        echo "❌ Comando 'zip' não encontrado!"
        echo ""
        echo "💡 Alternativa manual:"
        echo "   1. Selecione todos os arquivos (exceto node_modules/)"
        echo "   2. Clique com botão direito → Compactar"
        echo ""
    fi
}

# ========================================
# MÉTODO 4: DEPLOY DIRETO VERCEL CLI
# ========================================

deploy_vercel_direto() {
    echo "⚡ MÉTODO 4: Deploy Direto - Vercel CLI"
    echo "================================"
    echo ""
    
    # Verificar se Vercel CLI está instalado
    if ! command -v vercel &> /dev/null; then
        echo "📥 Instalando Vercel CLI..."
        npm i -g vercel
    else
        echo "✅ Vercel CLI já instalado"
    fi
    
    echo ""
    echo "🔐 Fazendo login na Vercel..."
    vercel login
    
    echo ""
    echo "🚀 Iniciando deploy..."
    vercel --prod
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
        echo ""
    else
        echo "❌ Erro no deploy!"
        return 1
    fi
}

# ========================================
# VERIFICAÇÕES PRÉ-DEPLOY
# ========================================

verificar_sistema() {
    echo "🔍 VERIFICANDO SISTEMA..."
    echo "================================"
    echo ""
    
    # Node.js
    if command -v node &> /dev/null; then
        echo "✅ Node.js: $(node --version)"
    else
        echo "❌ Node.js: NÃO INSTALADO"
    fi
    
    # npm
    if command -v npm &> /dev/null; then
        echo "✅ npm: $(npm --version)"
    else
        echo "❌ npm: NÃO INSTALADO"
    fi
    
    # Git
    if command -v git &> /dev/null; then
        echo "✅ Git: $(git --version)"
    else
        echo "❌ Git: NÃO INSTALADO"
    fi
    
    # Vercel CLI
    if command -v vercel &> /dev/null; then
        echo "✅ Vercel CLI: INSTALADO"
    else
        echo "⚠️  Vercel CLI: NÃO INSTALADO (opcional)"
    fi
    
    echo ""
    echo "📁 Estrutura do Projeto:"
    
    if [ -f "package.json" ]; then
        echo "✅ package.json encontrado"
    else
        echo "❌ package.json NÃO encontrado!"
    fi
    
    if [ -f "vite.config.ts" ]; then
        echo "✅ vite.config.ts encontrado"
    else
        echo "❌ vite.config.ts NÃO encontrado!"
    fi
    
    if [ -f "src/main.tsx" ]; then
        echo "✅ src/main.tsx encontrado"
    else
        echo "❌ src/main.tsx NÃO encontrado!"
    fi
    
    if [ -f "src/app/App.tsx" ]; then
        echo "✅ src/app/App.tsx encontrado"
    else
        echo "❌ src/app/App.tsx NÃO encontrado!"
    fi
    
    # Contar arquivos .tsx
    if [ -d "src" ]; then
        TSX_COUNT=$(find src -name "*.tsx" | wc -l)
        echo "📊 Arquivos .tsx encontrados: $TSX_COUNT"
    fi
    
    echo ""
}

# ========================================
# BACKUP ANTES DO DEPLOY
# ========================================

criar_backup() {
    echo "💾 CRIANDO BACKUP..."
    echo "================================"
    echo ""
    
    BACKUP_DIR="backups"
    BACKUP_FILE="$BACKUP_DIR/smcorp-backup-$(date +%Y%m%d-%H%M%S).zip"
    
    # Criar diretório de backup se não existir
    mkdir -p "$BACKUP_DIR"
    
    if command -v zip &> /dev/null; then
        echo "🗜️  Criando backup em: $BACKUP_FILE"
        zip -r "$BACKUP_FILE" . \
            -x "node_modules/*" \
            -x "dist/*" \
            -x ".git/*" \
            -x "backups/*"
        
        if [ $? -eq 0 ]; then
            echo "✅ Backup criado com sucesso!"
            echo "📦 Arquivo: $BACKUP_FILE"
            echo ""
        else
            echo "❌ Erro ao criar backup!"
        fi
    else
        echo "⚠️  Comando 'zip' não disponível. Pulando backup."
        echo ""
    fi
}

# ========================================
# MENU INTERATIVO
# ========================================

menu_principal() {
    clear
    echo "╔════════════════════════════════════════╗"
    echo "║   🚀 DEPLOY PLATAFORMA SMCORP v2.5.2  ║"
    echo "╚════════════════════════════════════════╝"
    echo ""
    echo "Escolha o método de deploy:"
    echo ""
    echo "  1) 🌐 GitHub + Vercel (Recomendado)"
    echo "  2) 🏗️  Build Local"
    echo "  3) 📦 Criar arquivo ZIP"
    echo "  4) ⚡ Deploy Direto - Vercel CLI"
    echo "  5) 🔍 Verificar Sistema"
    echo "  6) 💾 Criar Backup"
    echo "  0) ❌ Sair"
    echo ""
    read -p "Opção: " opcao
    
    case $opcao in
        1)
            clear
            deploy_github_vercel
            ;;
        2)
            clear
            build_local
            ;;
        3)
            clear
            criar_zip
            ;;
        4)
            clear
            deploy_vercel_direto
            ;;
        5)
            clear
            verificar_sistema
            ;;
        6)
            clear
            criar_backup
            ;;
        0)
            echo "👋 Até logo!"
            exit 0
            ;;
        *)
            echo "❌ Opção inválida!"
            ;;
    esac
    
    echo ""
    read -p "Pressione ENTER para continuar..."
    menu_principal
}

# ========================================
# EXECUÇÃO PRINCIPAL
# ========================================

# Se houver argumento, executar diretamente
if [ $# -eq 0 ]; then
    # Sem argumentos: mostrar menu
    menu_principal
else
    # Com argumento: executar comando específico
    case $1 in
        github)
            deploy_github_vercel
            ;;
        build)
            build_local
            ;;
        zip)
            criar_zip
            ;;
        vercel)
            deploy_vercel_direto
            ;;
        check)
            verificar_sistema
            ;;
        backup)
            criar_backup
            ;;
        *)
            echo "❌ Comando inválido!"
            echo ""
            echo "Comandos disponíveis:"
            echo "  ./COMANDOS_DEPLOY.sh github   - GitHub + Vercel"
            echo "  ./COMANDOS_DEPLOY.sh build    - Build local"
            echo "  ./COMANDOS_DEPLOY.sh zip      - Criar ZIP"
            echo "  ./COMANDOS_DEPLOY.sh vercel   - Deploy Vercel"
            echo "  ./COMANDOS_DEPLOY.sh check    - Verificar sistema"
            echo "  ./COMANDOS_DEPLOY.sh backup   - Criar backup"
            echo ""
            exit 1
            ;;
    esac
fi

# ========================================
# FIM DO SCRIPT
# ========================================
