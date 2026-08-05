# 🚀 GUIA VISUAL: DEPLOY EM 3 PASSOS

## ✨ **MÉTODO MAIS RÁPIDO: VERCEL (5 MINUTOS)**

---

## 📋 **PRÉ-REQUISITOS**

✅ Node.js instalado (https://nodejs.org)  
✅ Conta no GitHub (https://github.com)  
✅ Conta na Vercel (https://vercel.com)

---

## 🎯 **PASSO 1: PREPARAR O PROJETO**

### **1.1 - Verificar se o projeto está funcionando:**

```bash
# Abra o terminal na pasta do projeto e rode:
npm install
npm run dev
```

**✅ Resultado esperado:**  
O site deve abrir em `http://localhost:5173`

### **1.2 - Testar o build:**

```bash
npm run build
npm run preview
```

**✅ Resultado esperado:**  
Build sem erros, site abre em `http://localhost:4173`

---

## 🌐 **PASSO 2: SUBIR PARA O GITHUB**

### **2.1 - Criar repositório no GitHub:**

1. Acesse: https://github.com/new
2. Nome do repositório: `smcorp-platform`
3. Deixe em **Privado** (ou Público, você escolhe)
4. **NÃO marque** nenhuma opção (sem README, sem .gitignore)
5. Clique em **"Create repository"**

### **2.2 - Enviar código para o GitHub:**

```bash
# No terminal, na pasta do projeto:

# Inicializar Git (se ainda não fez)
git init

# Adicionar todos os arquivos
git add .

# Fazer primeiro commit
git commit -m "Deploy inicial - Plataforma SMCORP v2.5.2"

# Conectar ao GitHub (SUBSTITUA "SEU-USUARIO" pelo seu usuário do GitHub)
git remote add origin https://github.com/SEU-USUARIO/smcorp-platform.git

# Enviar para o GitHub
git branch -M main
git push -u origin main
```

**✅ Resultado esperado:**  
Todos os arquivos aparecem no seu repositório GitHub

---

## 🚀 **PASSO 3: DEPLOY NA VERCEL**

### **3.1 - Acessar Vercel:**

1. Acesse: https://vercel.com
2. Clique em **"Sign Up"** (ou **"Login"** se já tem conta)
3. Escolha **"Continue with GitHub"**
4. Autorize a Vercel a acessar seus repositórios

### **3.2 - Criar novo projeto:**

1. No dashboard da Vercel, clique em **"Add New"** → **"Project"**
2. Procure o repositório **"smcorp-platform"**
3. Clique em **"Import"**

### **3.3 - Configurar o projeto:**

**Framework Preset:**  
✅ Vercel detecta automaticamente: **Vite**

**Build Command:**  
```
npm run build
```

**Output Directory:**  
```
dist
```

**Install Command:**  
```
npm install
```

### **3.4 - Fazer deploy:**

1. Clique em **"Deploy"**
2. Aguarde 2-3 minutos ⏳
3. **PRONTO!** 🎉

**✅ Resultado esperado:**  
Você recebe um link tipo: `https://smcorp-platform.vercel.app`

---

## 🎊 **PARABÉNS! SEU SITE ESTÁ NO AR!**

### **🔗 Acesse seu site:**

```
https://seu-projeto.vercel.app
```

### **📊 O que você tem agora:**

✅ Site no ar 24/7  
✅ HTTPS automático (seguro)  
✅ Deploy automático a cada `git push`  
✅ Domínio gratuito `.vercel.app`  
✅ Performance otimizada (CDN global)  
✅ Logs e analytics

---

## 🔄 **ATUALIZAÇÕES FUTURAS**

Sempre que fizer mudanças no código:

```bash
# Salvar mudanças
git add .
git commit -m "Descrição da mudança"
git push

# ✨ A Vercel faz deploy automático!
```

---

## 🌐 **CONFIGURAR DOMÍNIO PRÓPRIO (OPCIONAL)**

Se você tem um domínio (ex: `www.meusite.com.br`):

### **Na Vercel:**

1. Vá em **Settings** → **Domains**
2. Clique em **"Add Domain"**
3. Digite seu domínio: `meusite.com.br`
4. Siga as instruções para configurar DNS

### **No seu provedor de domínio:**

Configure um registro **CNAME**:

```
Tipo: CNAME
Nome: @ (ou www)
Valor: cname.vercel-dns.com
TTL: Automático
```

Aguarde propagação (até 48h).

---

## 🐛 **SOLUÇÃO DE PROBLEMAS**

### **❌ Erro: "Build Failed"**

**Solução:**
```bash
# Teste localmente primeiro:
npm run build

# Se der erro, corrija e faça novo push
```

### **❌ Erro: "Module not found"**

**Solução:**
```bash
# Reinstale as dependências:
npm install

# Faça commit do package-lock.json:
git add package-lock.json
git commit -m "Atualizar dependências"
git push
```

### **❌ Erro: "Page not found (404)"**

**Solução:**

Crie arquivo `vercel.json` na raiz do projeto:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

```bash
git add vercel.json
git commit -m "Adicionar vercel.json"
git push
```

### **❌ localStorage não funciona**

**Verificar:**

- localStorage funciona normalmente em produção
- Certifique-se de estar acessando via HTTPS (não HTTP)
- Limpe o cache do navegador

---

## 📱 **TESTAR EM DIFERENTES DISPOSITIVOS**

Após deploy, teste em:

- ✅ Desktop (Chrome, Firefox, Edge)
- ✅ Mobile (iOS Safari, Android Chrome)
- ✅ Tablet
- ✅ Diferentes navegadores

---

## 📊 **MONITORAMENTO**

### **Analytics da Vercel:**

1. Vá em **Analytics** no dashboard
2. Veja:
   - Número de visitantes
   - Páginas mais acessadas
   - Performance
   - Erros

### **Google Analytics (opcional):**

Adicione no `index.html` (antes do `</head>`):

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

---

## 🔐 **SEGURANÇA**

### **Já incluído automaticamente:**

✅ HTTPS (SSL/TLS)  
✅ Headers de segurança  
✅ DDoS protection  
✅ CDN global

### **Recomendações:**

- ⚠️ **Não commite** senhas ou API keys
- ⚠️ Use **variáveis de ambiente** para dados sensíveis
- ⚠️ Mantenha **package.json** atualizado

---

## 💡 **DICAS PROFISSIONAIS**

### **1. Variáveis de Ambiente:**

Na Vercel:
1. Vá em **Settings** → **Environment Variables**
2. Adicione variáveis tipo:
   - `VITE_API_URL`
   - `VITE_API_KEY`

No código:
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

### **2. Preview Deployments:**

A Vercel cria um preview para cada branch:
```bash
git checkout -b feature-nova
git push origin feature-nova
# Recebe link de preview: https://smcorp-xxx-preview.vercel.app
```

### **3. Rollback Rápido:**

Se algo der errado:
1. Vá em **Deployments**
2. Escolha deploy anterior
3. Clique em **"Promote to Production"**

---

## 📞 **SUPORTE**

### **Documentação Oficial:**

- Vercel: https://vercel.com/docs
- Vite: https://vitejs.dev/guide/
- React: https://react.dev

### **Comunidade:**

- Stack Overflow
- GitHub Issues
- Discord da Vercel

---

## 🎯 **CHECKLIST FINAL**

Antes de compartilhar o link:

- [ ] ✅ Site abre sem erros
- [ ] ✅ Todos os 10 módulos funcionam
- [ ] ✅ Cards de alunos aparecem corretamente
- [ ] ✅ Instrutores com WhatsApp funcionam
- [ ] ✅ Sistema de custos funciona
- [ ] ✅ localStorage persiste dados
- [ ] ✅ Tema dark/light funciona
- [ ] ✅ Responsivo em mobile
- [ ] ✅ Performance boa (teste no Lighthouse)

---

## 🎨 **PERSONALIZAR**

### **Alterar cores/tema:**

Edite `/src/styles/theme.css`:

```css
:root {
  --cor-primaria: #DC2626; /* Vermelho SMCORP */
  --cor-secundaria: #FFFFFF; /* Branco */
  --cor-terciaria: #6B7280; /* Cinza */
}
```

### **Alterar logo:**

Substitua `/public/favicon.svg`

### **Alterar título:**

Edite `/index.html`:

```html
<title>SMCORP - Plataforma de Gestão</title>
```

---

## 🏆 **RESUMO: COMANDOS ESSENCIAIS**

```bash
# 1. Preparar
npm install
npm run build

# 2. GitHub
git init
git add .
git commit -m "Deploy SMCORP"
git remote add origin https://github.com/SEU-USUARIO/smcorp-platform.git
git push -u origin main

# 3. Vercel (via CLI - alternativa)
npm i -g vercel
vercel login
vercel --prod

# 4. Atualizações futuras
git add .
git commit -m "Atualização"
git push
```

---

## 🎉 **PRONTO!**

Seu site **SMCORP** está no ar, profissional e acessível globalmente!

**Link de exemplo:**  
`https://smcorp-platform.vercel.app`

---

**Dúvidas? Volte a este guia a qualquer momento!** 📚

