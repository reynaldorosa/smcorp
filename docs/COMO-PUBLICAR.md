# 🚀 Como Publicar a Plataforma SMCORP - Guia Rápido

## 🎯 Método Mais Fácil: Vercel (5 minutos)

### Passo 1: Criar conta Vercel
1. Acesse: **https://vercel.com**
2. Clique em **"Sign Up"**
3. Escolha **"Continue with GitHub"**

### Passo 2: Subir código no GitHub
```bash
# No terminal, dentro da pasta do projeto:
git init
git add .
git commit -m "Plataforma SMCORP - Deploy inicial"
git branch -M main

# Criar repositório no GitHub: https://github.com/new
# Depois executar:
git remote add origin https://github.com/SEU_USUARIO/smcorp.git
git push -u origin main
```

### Passo 3: Deploy na Vercel
1. Entre em **https://vercel.com**
2. Clique em **"Add New Project"**
3. Selecione o repositório **smcorp**
4. Clique em **"Deploy"**
5. ⏱️ Aguarde 2 minutos
6. ✅ **Pronto!** Seu sistema estará no ar

### URL do sistema:
```
https://smcorp-SEU-PROJETO.vercel.app
```

---

## 🔧 Usando o Script Automático

### Opção 1: Deploy Vercel
```bash
# Tornar script executável (apenas primeira vez)
chmod +x deploy.sh

# Fazer deploy
./deploy.sh vercel
```

### Opção 2: Deploy Netlify
```bash
./deploy.sh netlify
```

### Opção 3: Apenas gerar build
```bash
./deploy.sh build
# Depois copie a pasta 'dist' para seu servidor
```

---

## ⚙️ Configurar Domínio Próprio (Opcional)

### Na Vercel:
1. Vá em **Settings** → **Domains**
2. Adicione: `smcorp.suaempresa.com.br`
3. Configure DNS:
   - Tipo: `CNAME`
   - Nome: `smcorp`
   - Valor: `cname.vercel-dns.com`

---

## ⚠️ Importante: Dados Locais

**O sistema atual usa localStorage**, ou seja:
- ✅ Funciona sem backend
- ⚠️ Dados ficam apenas no navegador
- ⚠️ Limpar cache = perder dados
- ⚠️ Não sincroniza entre dispositivos

### Para usar em produção com múltiplos usuários:
Considere integrar com banco de dados:
- **Supabase** (recomendado) - https://supabase.com
- **Firebase** - https://firebase.google.com
- **Backend próprio** (Node.js + PostgreSQL)

---

## 📋 Checklist Antes de Publicar

- [ ] Testei tudo localmente: `npm run dev`
- [ ] Build funciona: `npm run build`
- [ ] Código no GitHub
- [ ] Deploy feito
- [ ] Site acessível
- [ ] Testei funcionalidades principais

---

## 🆘 Problemas Comuns

### "Build failed"
```bash
rm -rf node_modules
npm install
npm run build
```

### "Página em branco"
- Abra console do navegador (F12)
- Veja se há erros
- Teste localmente: `npm run preview`

### "Rotas não funcionam"
- Já está configurado no `vercel.json` ✅
- Já está configurado no `netlify.toml` ✅

---

## 🎉 Pronto!

Seu sistema está no ar! 🚀

**Próximos passos:**
1. Configure domínio personalizado (opcional)
2. Configure analytics (opcional)
3. Faça backup dos dados periodicamente
4. Considere migrar para banco de dados para produção

**Dúvidas?**
- Leia o guia completo: `README-DEPLOY.md`
- Veja logs no console (F12)
