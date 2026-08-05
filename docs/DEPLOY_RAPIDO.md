# ⚡ DEPLOY ULTRA-RÁPIDO - 3 MINUTOS

## 🚀 **COPIE E COLE ESTES COMANDOS**

---

## **PASSO 1: GITHUB** (1 minuto)

### **1.1 - Criar repositório:**
👉 Acesse: https://github.com/new  
👉 Nome: `smcorp-platform`  
👉 Clique em **"Create repository"**

### **1.2 - Enviar código:**

```bash
git init
git add .
git commit -m "SMCORP v2.5.2"
git remote add origin https://github.com/SEU-USUARIO/smcorp-platform.git
git branch -M main
git push -u origin main
```

⚠️ **IMPORTANTE:** Substitua `SEU-USUARIO` pelo seu usuário do GitHub!

---

## **PASSO 2: VERCEL** (2 minutos)

### **Opção A: Via Site (Mais fácil)**

1. Acesse: https://vercel.com
2. Login com GitHub
3. **"Add New"** → **"Project"**
4. Selecione `smcorp-platform`
5. **"Deploy"**

### **Opção B: Via CLI (Mais rápido)**

```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## 🎉 **PRONTO! SITE NO AR!**

Acesse: `https://seu-projeto.vercel.app`

---

## 🔄 **ATUALIZAÇÕES FUTURAS**

```bash
git add .
git commit -m "Atualização"
git push
```

✨ Deploy automático!

---

## 📋 **COMANDOS COMPLETOS (COPIAR TUDO)**

```bash
# ============================================
# 🚀 DEPLOY SMCORP - COMANDOS COMPLETOS
# ============================================

# 1. Testar localmente (opcional)
npm install
npm run build

# 2. Enviar para GitHub
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

# ✅ PRONTO!
```

---

## 🐛 **SOLUÇÃO RÁPIDA DE ERROS**

### **"remote origin already exists"**
```bash
git remote remove origin
git remote add origin https://github.com/SEU-USUARIO/smcorp-platform.git
```

### **"build failed"**
```bash
npm install
npm run build
```

### **"not a git repository"**
```bash
git init
```

---

## 💡 **LEMBRE-SE**

✅ Substitua `SEU-USUARIO` pelo seu nome de usuário do GitHub  
✅ Teste localmente antes: `npm run dev`  
✅ Salve este arquivo para referência futura

---

## 🎯 **RESULTADO FINAL**

Você terá:

✅ Código no GitHub  
✅ Site no ar 24/7  
✅ HTTPS automático  
✅ Deploy automático  
✅ Performance otimizada

**Link:** `https://smcorp-platform.vercel.app`

---

**FIM - Boa sorte! 🚀**

