# 📋 COMANDOS PRONTOS - COPIAR E COLAR

## ⚡ **DEPLOY RÁPIDO (5 MINUTOS)**

---

## 🎯 **OPÇÃO 1: GITHUB + VERCEL (RECOMENDADO)**

### **Passo 1: Preparar o projeto**

```bash
# Instalar dependências
npm install

# Testar se funciona
npm run dev

# Testar build
npm run build
```

### **Passo 2: Subir para GitHub**

#### **2.1 - PRIMEIRO: Crie o repositório no GitHub**
👉 Acesse: https://github.com/new  
👉 Nome: `smcorp-platform`  
👉 Clique em "Create repository"

#### **2.2 - DEPOIS: Cole estes comandos no terminal**

```bash
# Inicializar Git
git init

# Adicionar arquivos
git add .

# Primeiro commit
git commit -m "Deploy Plataforma SMCORP v2.5.2"

# ⚠️ SUBSTITUA "SEU-USUARIO" pelo seu nome de usuário do GitHub!
git remote add origin https://github.com/SEU-USUARIO/smcorp-platform.git

# Enviar para GitHub
git branch -M main
git push -u origin main
```

### **Passo 3: Deploy na Vercel**

#### **Método A: Via Interface (Mais fácil)**

1. Acesse: https://vercel.com
2. Faça login com GitHub
3. Clique em "Add New" → "Project"
4. Selecione `smcorp-platform`
5. Clique em "Deploy"
6. **PRONTO!** ✅

#### **Método B: Via CLI (Mais rápido)**

```bash
# Instalar Vercel CLI
npm install -g vercel

# Fazer login
vercel login

# Deploy
vercel --prod
```

**🎉 SEU SITE ESTÁ NO AR!**  
Link: `https://seu-projeto.vercel.app`

---

## 🎯 **OPÇÃO 2: APENAS BUILD LOCAL**

```bash
# Instalar dependências
npm install

# Fazer build
npm run build

# Testar build localmente
npm run preview
```

**Resultado:** Arquivos prontos em `./dist/`  
**Próximo passo:** Upload da pasta `dist/` para seu servidor

---

## 🎯 **OPÇÃO 3: CRIAR ARQUIVO ZIP**

### **Windows (PowerShell):**

```powershell
# ZIP completo (sem node_modules)
Compress-Archive -Path * -DestinationPath smcorp-completo.zip -Force -CompressionLevel Optimal

# Apenas arquivos essenciais
Compress-Archive -Path src,public,index.html,package.json,vite.config.ts,tsconfig.json -DestinationPath smcorp-essencial.zip -Force
```

### **Mac/Linux:**

```bash
# ZIP completo (sem node_modules)
zip -r smcorp-completo.zip . -x "node_modules/*" -x "dist/*" -x ".git/*"

# Apenas arquivos essenciais
zip -r smcorp-essencial.zip src/ public/ index.html package.json vite.config.ts tsconfig.json
```

---

## 🔄 **ATUALIZAÇÕES FUTURAS**

Depois que estiver no GitHub/Vercel, para cada atualização:

```bash
# Salvar mudanças
git add .

# Descrever o que mudou
git commit -m "Descrição da mudança"

# Enviar para GitHub (deploy automático!)
git push
```

✨ **A Vercel faz deploy automático a cada `git push`!**

---

## 🔍 **VERIFICAR STATUS DO PROJETO**

```bash
# Ver status do Git
git status

# Ver histórico de commits
git log --oneline

# Ver branches
git branch

# Ver remote
git remote -v
```

---

## 🐛 **SOLUÇÃO DE PROBLEMAS**

### **Erro: "not a git repository"**

```bash
git init
```

### **Erro: "remote origin already exists"**

```bash
# Remover remote antigo
git remote remove origin

# Adicionar novo
git remote add origin https://github.com/SEU-USUARIO/smcorp-platform.git
```

### **Erro: Build falhou**

```bash
# Limpar cache e reinstalar
rm -rf node_modules
rm package-lock.json
npm install
npm run build
```

### **Erro: "Module not found"**

```bash
# Reinstalar dependências
npm install

# Verificar se package.json está correto
cat package.json
```

### **Erro: Git push rejeitado**

```bash
# Forçar push (CUIDADO!)
git push -f origin main

# Ou pull primeiro
git pull origin main --rebase
git push origin main
```

---

## 🔐 **CRIAR ARQUIVO .gitignore**

Cole este conteúdo no arquivo `.gitignore`:

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
dist/
build/

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Editor
.vscode/
.idea/
*.swp
*.swo
*~

# OS
Thumbs.db
```

---

## 📦 **CRIAR ARQUIVO vercel.json**

Cole este conteúdo no arquivo `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

## 🌐 **CRIAR ARQUIVO netlify.toml** (alternativa ao Vercel)

Cole este conteúdo no arquivo `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
```

---

## 🔧 **VARIÁVEIS DE AMBIENTE (Opcional)**

### **Criar arquivo `.env` local:**

```bash
VITE_APP_NAME=SMCORP
VITE_API_URL=https://api.exemplo.com
VITE_VERSION=2.5.2
```

### **Configurar na Vercel:**

1. Acesse seu projeto na Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione as variáveis:
   - Name: `VITE_APP_NAME`, Value: `SMCORP`
   - Name: `VITE_API_URL`, Value: `https://api.exemplo.com`

### **Usar no código:**

```typescript
const appName = import.meta.env.VITE_APP_NAME;
const apiUrl = import.meta.env.VITE_API_URL;
```

---

## 📊 **COMANDOS DE ANÁLISE**

```bash
# Ver tamanho do projeto
du -sh .

# Contar arquivos .tsx
find src -name "*.tsx" | wc -l

# Ver dependências
npm list --depth=0

# Ver dependências desatualizadas
npm outdated

# Atualizar dependências (CUIDADO!)
npm update

# Limpar cache do npm
npm cache clean --force
```

---

## 🚀 **PERFORMANCE E OTIMIZAÇÃO**

```bash
# Analisar bundle size
npm run build -- --mode production

# Instalar analyzer
npm install -D rollup-plugin-visualizer

# Ver análise
npm run build && npx vite-bundle-visualizer
```

---

## 💾 **BACKUP E RESTORE**

### **Criar backup:**

```bash
# Backup completo
zip -r backup-$(date +%Y%m%d).zip . -x "node_modules/*" -x "dist/*"

# Backup apenas código-fonte
zip -r backup-src-$(date +%Y%m%d).zip src/
```

### **Restaurar backup:**

```bash
# Descompactar
unzip backup-20250101.zip -d projeto-restaurado/

# Instalar dependências
cd projeto-restaurado
npm install
```

---

## 🔗 **LINKS ÚTEIS**

### **Documentação:**
- Vercel: https://vercel.com/docs
- Vite: https://vitejs.dev/
- React: https://react.dev
- TypeScript: https://www.typescriptlang.org/

### **Ferramentas:**
- GitHub: https://github.com
- Vercel Dashboard: https://vercel.com/dashboard
- Netlify: https://www.netlify.com

### **Tutoriais:**
- Git Basics: https://git-scm.com/book/pt-br/v2
- Deploy Vercel: https://vercel.com/docs/deployments/overview

---

## 📱 **TESTAR EM PRODUÇÃO**

```bash
# Simular produção localmente
npm run build
npm run preview

# Abrir em diferentes portas
npm run preview -- --port 8080
```

### **Testar performance:**

1. Abra o Chrome DevTools (F12)
2. Vá em **Lighthouse**
3. Clique em **"Generate report"**

**Meta:** Performance > 90, Acessibilidade > 90

---

## 🎯 **COMANDOS MAIS USADOS**

```bash
# Desenvolvimento
npm run dev               # Iniciar servidor local
npm run build            # Fazer build de produção
npm run preview          # Testar build localmente

# Git
git status              # Ver mudanças
git add .               # Adicionar tudo
git commit -m "msg"     # Commitar
git push                # Enviar para GitHub

# Vercel
vercel                  # Deploy preview
vercel --prod           # Deploy produção
vercel logs             # Ver logs
vercel domains          # Gerenciar domínios
```

---

## 🏁 **CHECKLIST FINAL**

Antes de fazer deploy:

```bash
# ✅ 1. Projeto funciona localmente
npm run dev

# ✅ 2. Build sem erros
npm run build

# ✅ 3. Preview funciona
npm run preview

# ✅ 4. Git configurado
git status

# ✅ 5. Código no GitHub
git push

# ✅ 6. Deploy na Vercel
vercel --prod

# ✅ 7. Site está no ar!
# Acesse: https://seu-projeto.vercel.app
```

---

## 🎉 **PRONTO!**

**Comandos essenciais em ordem:**

```bash
# 1. Preparar
npm install && npm run build

# 2. Git + GitHub
git init
git add .
git commit -m "Deploy SMCORP v2.5.2"
git remote add origin https://github.com/SEU-USUARIO/smcorp-platform.git
git push -u origin main

# 3. Vercel
npm i -g vercel
vercel login
vercel --prod
```

**✨ Em 5 minutos seu site estará no ar!**

---

## 💡 **DICA FINAL**

**Salve estes comandos** em um arquivo `.txt` no seu computador para referência rápida.

**Boa sorte com o deploy! 🚀**

