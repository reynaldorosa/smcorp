# 📦 GUIA DE EXPORTAÇÃO - PLATAFORMA SMCORP

## 🎯 **3 MÉTODOS PARA EXPORTAR TODOS OS ARQUIVOS .TSX**

---

## **MÉTODO 1: VIA GITHUB (RECOMENDADO)** ✅

### **Passo a Passo:**

```bash
# 1. Inicializar repositório Git (se ainda não fez)
git init

# 2. Adicionar todos os arquivos
git add .

# 3. Fazer commit
git commit -m "Plataforma SMCORP - Versão 2.5.2 Completa"

# 4. Criar repositório no GitHub
# Acesse: https://github.com/new
# Nome sugerido: smcorp-platform

# 5. Conectar ao repositório remoto
git remote add origin https://github.com/SEU-USUARIO/smcorp-platform.git

# 6. Enviar para o GitHub
git branch -M main
git push -u origin main

# ✅ PRONTO! Todos os arquivos estão no GitHub
```

### **Vantagens:**
- ✅ Backup automático
- ✅ Controle de versão
- ✅ Facilita deploy (Vercel/Netlify)
- ✅ Colaboração em equipe
- ✅ Histórico de mudanças

---

## **MÉTODO 2: VIA ARQUIVO ZIP** 📦

### **Criar ZIP Completo do Projeto:**

```bash
# Windows (PowerShell):
Compress-Archive -Path * -DestinationPath smcorp-completo.zip

# Mac/Linux:
zip -r smcorp-completo.zip . -x "node_modules/*" -x ".git/*" -x "dist/*"
```

### **Criar ZIP Apenas dos Arquivos .TSX:**

```bash
# Mac/Linux:
find src -name "*.tsx" | zip smcorp-tsx-files.zip -@

# Windows (PowerShell):
Get-ChildItem -Path src -Filter *.tsx -Recurse | Compress-Archive -DestinationPath smcorp-tsx-files.zip
```

### **Estrutura do ZIP:**
```
smcorp-completo.zip
├── src/
│   ├── main.tsx
│   ├── app/
│   │   ├── App.tsx
│   │   ├── components/ (70+ arquivos .tsx)
│   │   ├── contexts/ (2 arquivos .tsx)
│   │   ├── hooks/ (1 arquivo)
│   │   └── utils/ (2 arquivos)
├── public/
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## **MÉTODO 3: VIA FTP/HOSPEDAGEM** 🌐

### **Upload Manual:**

1. **Acesse seu servidor via FTP** (FileZilla, WinSCP, etc.)
2. **Faça o build local:**
   ```bash
   npm run build
   ```
3. **Upload da pasta `dist/`** para o servidor
4. **Configure o servidor** para servir arquivos estáticos

### **Estrutura do Build:**
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js (código compilado)
│   └── index-[hash].css (estilos)
└── favicon.svg
```

---

## 📂 **ESTRUTURA COMPLETA PARA EXPORTAÇÃO**

### **Arquivos Essenciais:**

```
RAIZ DO PROJETO/
│
├── 📁 src/
│   ├── 📄 main.tsx ⭐
│   │
│   ├── 📁 app/
│   │   ├── 📄 App.tsx ⭐⭐⭐
│   │   │
│   │   ├── 📁 components/ (70+ arquivos)
│   │   │   ├── Modulo00.tsx
│   │   │   ├── Modulo01.tsx
│   │   │   ├── Modulo02.tsx
│   │   │   ├── Modulo03.tsx
│   │   │   ├── Modulo04.tsx
│   │   │   ├── Modulo05.tsx
│   │   │   ├── Modulo06.tsx
│   │   │   ├── Modulo06Detalhado.tsx
│   │   │   ├── Modulo07.tsx
│   │   │   ├── Modulo08.tsx
│   │   │   ├── Modulo09.tsx
│   │   │   ├── Layout.tsx
│   │   │   ├── Card*.tsx (4 arquivos)
│   │   │   ├── Dialog*.tsx (22 arquivos)
│   │   │   ├── 📁 ui/ (44 componentes shadcn)
│   │   │   └── 📁 figma/ (1 componente protegido)
│   │   │
│   │   ├── 📁 contexts/
│   │   │   ├── SMCorpContext.tsx ⭐⭐
│   │   │   └── ThemeContext.tsx ⭐
│   │   │
│   │   ├── 📁 hooks/
│   │   │   └── usePersistedState.ts ⭐
│   │   │
│   │   └── 📁 utils/
│   │       ├── gerarCustosInteligentes.ts
│   │       └── permissoes.ts
│   │
│   └── 📁 styles/
│       ├── index.css
│       ├── tailwind.css
│       ├── theme.css
│       └── fonts.css
│
├── 📁 public/
│   └── favicon.svg
│
├── 📄 package.json ⭐⭐⭐
├── 📄 vite.config.ts ⭐⭐
├── 📄 tsconfig.json ⭐
├── 📄 index.html ⭐
├── 📄 postcss.config.mjs
├── 📄 vercel.json (para deploy Vercel)
└── 📄 netlify.toml (para deploy Netlify)
```

⭐ = Essencial | ⭐⭐ = Muito importante | ⭐⭐⭐ = Crítico

---

## 🔍 **VERIFICAR INTEGRIDADE DOS ARQUIVOS**

### **Checklist Antes de Exportar:**

```bash
# 1. Verificar se todos os .tsx existem
find src -name "*.tsx" | wc -l
# Deve retornar: ~95 arquivos

# 2. Verificar se o projeto compila
npm run build
# Deve completar sem erros

# 3. Verificar tamanho do projeto
du -sh .
# Sem node_modules: ~5-10 MB
# Com node_modules: ~500-800 MB

# 4. Listar arquivos principais
ls -lh src/app/*.tsx
ls -lh src/app/components/*.tsx
ls -lh src/app/contexts/*.tsx
```

---

## 📋 **LISTA DE VERIFICAÇÃO PRÉ-EXPORTAÇÃO**

### **Antes de Exportar:**

- [ ] ✅ Todos os módulos (00-09) estão presentes
- [ ] ✅ SMCorpContext.tsx e ThemeContext.tsx existem
- [ ] ✅ usePersistedState.ts está implementado
- [ ] ✅ Todos os 22 Dialogs estão completos
- [ ] ✅ Componentes UI (shadcn) estão instalados
- [ ] ✅ package.json tem todas as dependências
- [ ] ✅ vite.config.ts está configurado
- [ ] ✅ tsconfig.json está correto
- [ ] ✅ Build local funciona: `npm run build`
- [ ] ✅ Preview local funciona: `npm run preview`

### **Após Exportar:**

- [ ] ✅ Arquivo/repositório criado
- [ ] ✅ Tamanho correto (~5-10 MB sem node_modules)
- [ ] ✅ Todos os .tsx incluídos (95 arquivos)
- [ ] ✅ package.json presente
- [ ] ✅ Configurações de build presentes

---

## 🚀 **EXPORTAR E FAZER DEPLOY EM 5 MINUTOS**

### **Fluxo Rápido (Recomendado):**

```bash
# 1. Instalar Vercel CLI globalmente
npm i -g vercel

# 2. No diretório do projeto
vercel login

# 3. Deploy (primeira vez)
vercel

# 4. Deploy para produção
vercel --prod

# ✅ PRONTO! Receba o link: https://smcorp-xxx.vercel.app
```

### **Resultado:**
- ⚡ Deploy em 2-3 minutos
- 🌐 Site no ar com HTTPS
- 🔄 CI/CD automático (se usar GitHub)
- 📊 Analytics incluído
- 💾 localStorage funcional

---

## 📦 **EXPORTAR APENAS CÓDIGO-FONTE (SEM DEPENDÊNCIAS)**

### **Criar Pacote Leve:**

```bash
# Excluir node_modules, dist, cache
zip -r smcorp-source.zip . \
  -x "node_modules/*" \
  -x "dist/*" \
  -x ".git/*" \
  -x "*.log" \
  -x ".vscode/*" \
  -x ".idea/*"
```

### **Tamanho esperado:**
- **Com node_modules**: ~600 MB
- **Sem node_modules**: ~5-8 MB ✅ (recomendado)

---

## 🔐 **BACKUP COMPLETO (COM DADOS)**

### **Incluir localStorage (dados mockados):**

```bash
# 1. Exportar localStorage do navegador
# Abra DevTools (F12) → Console → Cole:
console.save = function(data, filename) {
    const blob = new Blob([JSON.stringify(data)], {type: 'text/json'});
    const link = document.createElement('a');
    link.download = filename;
    link.href = window.URL.createObjectURL(blob);
    link.click();
}

# Exportar todos os dados:
console.save(localStorage, 'smcorp-backup.json');

# 2. Salvar junto com o código
# Colocar smcorp-backup.json na pasta /backup/
```

---

## 🌐 **EXPORTAR PARA DIFERENTES AMBIENTES**

### **1. Desenvolvimento:**
```bash
# Incluir tudo (node_modules, .git, etc.)
zip -r smcorp-dev.zip .
```

### **2. Produção:**
```bash
# Apenas arquivos essenciais
npm run build
cd dist
zip -r ../smcorp-prod.zip .
```

### **3. Código-fonte:**
```bash
# Apenas src/ e configs
zip -r smcorp-src.zip src/ package.json vite.config.ts tsconfig.json index.html
```

---

## 📤 **COMPARTILHAR COM EQUIPE**

### **Opções:**

1. **GitHub (Privado/Público)**
   - ✅ Controle de versão
   - ✅ Colaboração
   - ✅ Issues e PRs

2. **Google Drive / Dropbox**
   - ✅ Fácil compartilhamento
   - ✅ Sincronização automática
   - ❌ Sem controle de versão

3. **WeTransfer / Send**
   - ✅ Envio rápido de arquivos grandes
   - ❌ Expira em poucos dias
   - ❌ Sem controle de versão

---

## 🛠️ **RECUPERAR PROJETO EXPORTADO**

### **Após Download/Clone:**

```bash
# 1. Descompactar (se ZIP)
unzip smcorp-completo.zip
cd smcorp-completo

# 2. Instalar dependências
npm install

# 3. Executar em desenvolvimento
npm run dev

# 4. Build para produção
npm run build

# 5. Preview do build
npm run preview
```

---

## 🎯 **RESUMO: MÉTODO MAIS RÁPIDO**

### **🏆 RECOMENDAÇÃO: GitHub + Vercel**

```bash
# Tempo total: ~5 minutos

# 1. Subir para GitHub (2 min)
git init
git add .
git commit -m "SMCORP Platform"
git remote add origin <seu-repo>
git push -u origin main

# 2. Deploy na Vercel (3 min)
npm i -g vercel
vercel login
vercel --prod

# ✅ RESULTADO:
# - Código no GitHub: github.com/seu-usuario/smcorp
# - Site no ar: https://smcorp.vercel.app
# - Deploy automático em cada push
```

---

## 📞 **PRECISA DE AJUDA?**

- **Erro no build?** Verifique `npm run build`
- **Erro no deploy?** Verifique logs do Vercel/Netlify
- **Arquivo faltando?** Use o checklist acima
- **Tamanho muito grande?** Exclua `node_modules/`

---

## 📊 **ESTATÍSTICAS DO PROJETO**

- **Total de arquivos .tsx**: 95
- **Total de linhas de código**: ~40.000+
- **Tamanho sem node_modules**: ~5-8 MB
- **Tamanho com node_modules**: ~600 MB
- **Tamanho do build (dist)**: ~2-3 MB
- **Tempo de build**: ~30-60 segundos
- **Tempo de deploy**: ~2-3 minutos

---

**✅ PRONTO PARA EXPORTAR E PUBLICAR!**

Use o **MÉTODO 1 (GitHub + Vercel)** para resultados rápidos e profissionais.

