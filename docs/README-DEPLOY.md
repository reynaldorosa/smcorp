# 🚀 Guia de Deploy - Plataforma SMCORP

## 📋 Visão Geral

A **Plataforma SMCORP** é um sistema completo de gestão para centros de treinamento profissionalizante, desenvolvido em React + Vite com TypeScript.

**⚠️ IMPORTANTE:** Esta versão utiliza **localStorage** para armazenar dados. Para ambientes de produção com múltiplos usuários, recomendamos integração com banco de dados (Supabase, Firebase, PostgreSQL, etc.).

---

## 🎯 Opções de Deploy

### 1️⃣ **VERCEL** (Recomendado - Mais Fácil)

#### ✅ Vantagens:
- Deploy em 5 minutos
- 100% Gratuito para projetos pessoais
- HTTPS automático
- Deploy automático via GitHub
- Otimizado para Vite

#### 📝 Passo a Passo:

1. **Criar conta:**
   - Acesse: https://vercel.com
   - Clique em "Sign Up"
   - Escolha "Continue with GitHub"

2. **Preparar repositório GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Deploy inicial - Plataforma SMCORP"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/smcorp.git
   git push -u origin main
   ```

3. **Fazer deploy:**
   - Na Vercel, clique em "Add New Project"
   - Selecione seu repositório
   - Clique em "Deploy"
   - Aguarde ~2 minutos

4. **Acessar:**
   - URL fornecida: `https://smcorp-seu-projeto.vercel.app`

#### 🔧 Configurações Opcionais:

**Domínio Customizado:**
1. Vá em Settings > Domains
2. Adicione seu domínio (ex: `smcorp.suaempresa.com.br`)
3. Configure DNS conforme instruções

**Variáveis de Ambiente:**
1. Vá em Settings > Environment Variables
2. Adicione variáveis necessárias

---

### 2️⃣ **NETLIFY** (Alternativa Simples)

#### ✅ Vantagens:
- Interface intuitiva
- Gratuito
- HTTPS automático

#### 📝 Passo a Passo:

1. **Criar conta:**
   - Acesse: https://netlify.com
   - Faça login com GitHub

2. **Deploy:**
   - Clique em "Add new site" → "Import an existing project"
   - Conecte seu repositório GitHub
   - Clique em "Deploy site"

3. **Acessar:**
   - URL: `https://smcorp.netlify.app`

---

### 3️⃣ **SERVIDOR PRÓPRIO** (VPS/Hospedagem)

#### 📝 Para quem tem servidor Linux:

**1. Gerar build:**
```bash
npm run build
```
Isso cria a pasta `/dist` com arquivos otimizados.

**2. Configurar Nginx:**

Criar arquivo de configuração:
```bash
sudo nano /etc/nginx/sites-available/smcorp
```

Adicionar:
```nginx
server {
    listen 80;
    server_name seu-dominio.com.br;

    root /var/www/smcorp;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Compressão gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

**3. Ativar site:**
```bash
sudo ln -s /etc/nginx/sites-available/smcorp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**4. Configurar HTTPS:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com.br
```

---

## ⚙️ Configurações Importantes

### 🔒 **Segurança dos Dados**

A versão atual usa **localStorage**, o que significa:

- ✅ **Vantagens:**
  - Não precisa de backend/servidor
  - Rápido e simples
  - Funciona offline

- ⚠️ **Limitações:**
  - Dados ficam apenas no navegador do usuário
  - Não sincroniza entre dispositivos
  - Limpar cache = perder dados
  - Máximo ~5-10MB de armazenamento

### 💡 **Para Produção - Recomendações:**

**Opção 1: Supabase (Recomendado)**
- Backend como serviço
- PostgreSQL
- Autenticação integrada
- Gratuito até 500MB
- Deploy: https://supabase.com

**Opção 2: Firebase**
- Banco de dados real-time
- Autenticação
- Gratuito com limites
- Deploy: https://firebase.google.com

**Opção 3: Backend Próprio**
- Node.js + PostgreSQL
- API REST ou GraphQL
- Controle total

---

## 📦 **Build de Produção**

### Gerar build otimizado:
```bash
npm run build
```

### Testar build localmente:
```bash
npm run preview
```

### Tamanho do bundle:
- O build final ficará em `/dist`
- Tamanho estimado: ~800KB (gzipped)

---

## 🔧 **Variáveis de Ambiente**

Crie arquivo `.env` na raiz (se necessário):
```env
VITE_API_URL=https://api.suaempresa.com.br
VITE_APP_VERSION=2.5.2
```

Acesse no código:
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

---

## 🌐 **Domínio Personalizado**

### Configurar DNS:

**Para Vercel:**
- Tipo: `CNAME`
- Nome: `smcorp` (ou `@` para raiz)
- Valor: `cname.vercel-dns.com`

**Para Netlify:**
- Tipo: `CNAME`
- Nome: `smcorp`
- Valor: `smcorp.netlify.app`

---

## 📊 **Monitoramento**

### Analytics (Opcional):

**Google Analytics:**
1. Criar conta em https://analytics.google.com
2. Instalar: `npm install @analytics/google-analytics`
3. Configurar tracking ID

**Vercel Analytics:**
- Ativar em Settings > Analytics
- Gratuito

---

## 🐛 **Resolução de Problemas**

### Build falha:
```bash
# Limpar cache
rm -rf node_modules
rm package-lock.json
npm install
npm run build
```

### Página em branco após deploy:
- Verificar console do navegador (F12)
- Conferir se `base` está correto no `vite.config.ts`
- Testar localmente: `npm run preview`

### Rotas não funcionam:
- Adicionar redirects no arquivo de config da plataforma
- Para Vercel: já configurado em `vercel.json`
- Para Netlify: já configurado em `netlify.toml`

---

## 📞 **Suporte**

Para dúvidas ou problemas:
- Verificar logs no console do navegador (F12)
- Verificar logs da plataforma de deploy
- Revisar este guia

---

## 🎉 **Checklist Final**

Antes de fazer deploy:

- [ ] Testei localmente: `npm run dev`
- [ ] Build funciona: `npm run build` + `npm run preview`
- [ ] Removi logs de debug desnecessários
- [ ] Configurei variáveis de ambiente (se necessário)
- [ ] Commit de todo código no Git
- [ ] Push para GitHub
- [ ] Deploy feito com sucesso
- [ ] Site acessível pela URL
- [ ] Testei todas as funcionalidades principais
- [ ] Configurei backup periódico dos dados (se usando localStorage)

---

**🚀 Boa sorte com o deploy da Plataforma SMCORP!**
