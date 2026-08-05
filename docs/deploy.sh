#!/bin/bash

# 🚀 Script de Deploy Automático - Plataforma SMCORP
# Uso: ./deploy.sh [vercel|netlify|build]

set -e  # Parar em caso de erro

echo "🚀 ======================================"
echo "   DEPLOY - PLATAFORMA SMCORP v2.5.2"
echo "========================================"
echo ""

# Função para colorir output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não está instalado!${NC}"
    echo "Instale: https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✅ Node.js: $(node -v)${NC}"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm não está instalado!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm: $(npm -v)${NC}"
echo ""

# Verificar argumento
DEPLOY_TYPE="${1:-build}"

case $DEPLOY_TYPE in
    vercel)
        echo -e "${BLUE}📦 Deploy para VERCEL...${NC}"
        echo ""
        
        # Verificar se Vercel CLI está instalado
        if ! command -v vercel &> /dev/null; then
            echo -e "${YELLOW}⚠️  Vercel CLI não encontrado. Instalando...${NC}"
            npm install -g vercel
        fi
        
        echo -e "${GREEN}✅ Vercel CLI instalado${NC}"
        echo ""
        
        # Fazer build
        echo -e "${BLUE}🔨 Gerando build de produção...${NC}"
        npm run build
        
        echo ""
        echo -e "${GREEN}✅ Build concluído!${NC}"
        echo ""
        
        # Deploy
        echo -e "${BLUE}🚀 Fazendo deploy para Vercel...${NC}"
        vercel --prod
        
        echo ""
        echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
        ;;
        
    netlify)
        echo -e "${BLUE}📦 Deploy para NETLIFY...${NC}"
        echo ""
        
        # Verificar se Netlify CLI está instalado
        if ! command -v netlify &> /dev/null; then
            echo -e "${YELLOW}⚠️  Netlify CLI não encontrado. Instalando...${NC}"
            npm install -g netlify-cli
        fi
        
        echo -e "${GREEN}✅ Netlify CLI instalado${NC}"
        echo ""
        
        # Fazer build
        echo -e "${BLUE}🔨 Gerando build de produção...${NC}"
        npm run build
        
        echo ""
        echo -e "${GREEN}✅ Build concluído!${NC}"
        echo ""
        
        # Deploy
        echo -e "${BLUE}🚀 Fazendo deploy para Netlify...${NC}"
        netlify deploy --prod --dir=dist
        
        echo ""
        echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
        ;;
        
    build)
        echo -e "${BLUE}🔨 Gerando build de produção...${NC}"
        echo ""
        
        # Limpar build anterior
        if [ -d "dist" ]; then
            echo -e "${YELLOW}🧹 Limpando build anterior...${NC}"
            rm -rf dist
        fi
        
        # Instalar dependências (se necessário)
        if [ ! -d "node_modules" ]; then
            echo -e "${YELLOW}📦 Instalando dependências...${NC}"
            npm install
            echo ""
        fi
        
        # Build
        npm run build
        
        echo ""
        echo -e "${GREEN}✅ Build concluído!${NC}"
        echo ""
        echo -e "${BLUE}📁 Arquivos gerados em: ./dist${NC}"
        echo ""
        
        # Mostrar tamanho
        if command -v du &> /dev/null; then
            DIST_SIZE=$(du -sh dist | cut -f1)
            echo -e "${BLUE}📊 Tamanho do build: $DIST_SIZE${NC}"
        fi
        
        echo ""
        echo -e "${YELLOW}💡 Para testar localmente:${NC}"
        echo -e "   npm run preview"
        echo ""
        echo -e "${YELLOW}💡 Para fazer upload:${NC}"
        echo -e "   1. Copie a pasta 'dist' para seu servidor"
        echo -e "   2. Configure o servidor web (Nginx/Apache)"
        echo -e "   3. Aponte o root para a pasta 'dist'"
        ;;
        
    *)
        echo -e "${RED}❌ Opção inválida!${NC}"
        echo ""
        echo "Uso: ./deploy.sh [opção]"
        echo ""
        echo "Opções disponíveis:"
        echo "  vercel   - Deploy para Vercel"
        echo "  netlify  - Deploy para Netlify"
        echo "  build    - Apenas gerar build (padrão)"
        echo ""
        echo "Exemplos:"
        echo "  ./deploy.sh vercel"
        echo "  ./deploy.sh netlify"
        echo "  ./deploy.sh build"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 ======================================"
echo "   PROCESSO CONCLUÍDO COM SUCESSO!"
echo "======================================${NC}"
