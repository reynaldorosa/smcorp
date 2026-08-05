# 🔧 Solução de Problemas - SMCORP

## ❌ Erros Comuns e Soluções

### 1. "TypeError: Failed to fetch"

**Causa:** Geralmente ocorre quando há importações de assets que não existem ou problemas de CORS.

**Solução:**
```bash
# Limpar cache e reinstalar
rm -rf node_modules
rm -rf dist
npm install
npm run build
```

### 2. "Module not found" ou "Cannot find module"

**Causa:** Dependências não instaladas ou problemas no path.

**Solução:**
```bash
# Reinstalar dependências
npm install

# Verificar se todas estão instaladas
npm list
```

### 3. Página em branco após deploy

**Causa:** Problemas no build ou configuração de rotas.

**Solução:**

1. Testar localmente:
```bash
npm run build
npm run preview
```

2. Verificar console do navegador (F12)

3. Para Vercel - Verificar `vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

4. Para Netlify - Verificar `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 4. "Cannot read property of undefined"

**Causa:** Tentando acessar dados que ainda não foram carregados.

**Solução:**
- Verificar se está usando optional chaining (`?.`)
- Adicionar verificações de null/undefined
- Usar valores padrão

```typescript
// ❌ Errado
const nome = usuario.nome;

// ✅ Correto
const nome = usuario?.nome || 'Sem nome';
```

### 5. localStorage não persiste dados

**Causa:** Navegador em modo privado ou limite excedido.

**Soluções:**
- Desativar modo privado/anônimo
- Limpar dados antigos
- Verificar limite (5-10MB geralmente)

```javascript
// Verificar tamanho do localStorage
function getLocalStorageSize() {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  return (total / 1024 / 1024).toFixed(2) + ' MB';
}

console.log('Tamanho localStorage:', getLocalStorageSize());
```

### 6. Build muito lento

**Causa:** Muitas dependências ou arquivos grandes.

**Soluções:**
```bash
# Limpar cache do Vite
rm -rf node_modules/.vite

# Build com mais memória (se necessário)
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

### 7. Erro de permissão ao executar deploy.sh

**Causa:** Script sem permissão de execução.

**Solução:**
```bash
chmod +x deploy.sh
./deploy.sh build
```

### 8. "Hydration mismatch" ou warnings de React

**Causa:** Diferenças entre servidor e cliente (raro em SPA).

**Solução:**
- Verificar logs no console
- Garantir que `key` props sejam únicas
- Não usar `Math.random()` como key

### 9. Imagens não carregam

**Causa:** Caminhos incorretos ou assets não encontrados.

**Solução:**
```typescript
// ✅ Usar importação correta
import logo from '@/assets/logo.png';

// ✅ Ou usar pasta public
<img src="/logo.png" alt="Logo" />
```

### 10. Tailwind classes não funcionam

**Causa:** CSS não compilado ou configuração incorreta.

**Solução:**
1. Verificar `tailwind.config.js`
2. Verificar imports no `src/styles/index.css`:
```css
@import './fonts.css';
@import './tailwind.css';
@import './theme.css';
```

3. Rebuild:
```bash
npm run dev
```

---

## 🐛 Debug Mode

### Ativar logs detalhados

No arquivo `.env`:
```
VITE_DEBUG=true
```

No código:
```typescript
if (import.meta.env.VITE_DEBUG === 'true') {
  console.log('Debug:', dados);
}
```

---

## 📊 Verificar Performance

### 1. Build Size Analysis

```bash
npm run build

# Ver tamanho dos arquivos
ls -lh dist/assets/
```

### 2. Chrome DevTools

1. Abrir DevTools (F12)
2. Aba **Performance**
3. Gravar sessão
4. Analisar gargalos

### 3. Lighthouse

1. Abrir DevTools (F12)
2. Aba **Lighthouse**
3. Gerar relatório
4. Seguir recomendações

---

## 🔍 Verificar Estado da Aplicação

### Console do Navegador (F12)

```javascript
// Ver dados do localStorage
console.log(localStorage);

// Ver dados específicos do SMCORP
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('smcorp_')) {
    console.log(key, JSON.parse(localStorage[key]));
  }
});

// Limpar dados (CUIDADO!)
// localStorage.clear();
```

---

## 📞 Ainda com Problemas?

### Checklist Final:

- [ ] Node.js 18+ instalado?
- [ ] Dependências instaladas? (`npm install`)
- [ ] Build funciona localmente? (`npm run build`)
- [ ] Console do navegador sem erros? (F12)
- [ ] Arquivos de configuração corretos?
- [ ] Variáveis de ambiente configuradas?

### Logs Úteis:

```bash
# Logs do Vercel
vercel logs

# Logs do Netlify
netlify logs

# Build com verbose
npm run build -- --mode development
```

---

## 🆘 Suporte

Se nenhuma solução funcionou:

1. **Copie o erro completo** do console (F12)
2. **Anote os passos** que causaram o erro
3. **Verifique versões:**
```bash
node -v
npm -v
```
4. **Entre em contato** com detalhes

---

**Última atualização:** Janeiro 2026
