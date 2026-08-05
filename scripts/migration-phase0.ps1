# ============================================
# SMCORP - Script de Migração Fase 0
# Preparação do Ambiente
# ============================================

Write-Host "🚀 SMCORP - Iniciando Migração Fase 0" -ForegroundColor Cyan
Write-Host "=" * 50

$frontendPath = "c:\Users\uniqs\Desktop\PORTALSMCORP\frontend"
$figmaPath = "c:\Users\uniqs\Desktop\PORTALSMCORP\portalsmcorpfigma"

# Navegar para o frontend
Set-Location $frontendPath

# ============================================
# PASSO 1: Instalar Componentes shadcn/ui Faltantes
# ============================================
Write-Host "`n📦 Passo 1: Instalando componentes shadcn/ui faltantes..." -ForegroundColor Yellow

$componentesParaInstalar = @(
    "accordion",
    "alert",
    "aspect-ratio",
    "breadcrumb",
    "carousel",
    "chart",
    "collapsible",
    "command",
    "context-menu",
    "drawer",
    "form",
    "hover-card",
    "input-otp",
    "menubar",
    "navigation-menu",
    "pagination",
    "radio-group",
    "resizable",
    "scroll-area",
    "separator",
    "sheet",
    "sidebar",
    "slider",
    "toggle",
    "toggle-group",
    "tooltip"
)

Write-Host "Componentes a instalar: $($componentesParaInstalar.Count)" -ForegroundColor Gray

# Instalar todos de uma vez
$componentesString = $componentesParaInstalar -join " "
Write-Host "Executando: npx shadcn@latest add $componentesString" -ForegroundColor DarkGray

# ============================================
# PASSO 2: Criar Estrutura de Pastas
# ============================================
Write-Host "`n📁 Passo 2: Criando estrutura de pastas..." -ForegroundColor Yellow

$pastasParaCriar = @(
    "$frontendPath\src\components\dialogs",
    "$frontendPath\src\components\cards",
    "$frontendPath\src\components\forms",
    "$frontendPath\src\stores",
    "$frontendPath\src\app\(dashboard)\courses",
    "$frontendPath\src\app\(dashboard)\classes",
    "$frontendPath\src\app\(dashboard)\students",
    "$frontendPath\src\app\(dashboard)\documents",
    "$frontendPath\src\app\(dashboard)\companies",
    "$frontendPath\src\app\(dashboard)\financial",
    "$frontendPath\src\app\(dashboard)\instructors",
    "$frontendPath\src\app\(dashboard)\costs",
    "$frontendPath\src\app\(dashboard)\settings"
)

foreach ($pasta in $pastasParaCriar) {
    if (-not (Test-Path $pasta)) {
        New-Item -ItemType Directory -Path $pasta -Force | Out-Null
        Write-Host "  ✅ Criado: $pasta" -ForegroundColor Green
    } else {
        Write-Host "  ⏭️  Existe: $pasta" -ForegroundColor Gray
    }
}

# ============================================
# PASSO 3: Listar Componentes do Figma
# ============================================
Write-Host "`n📋 Passo 3: Listando componentes do Figma para migrar..." -ForegroundColor Yellow

$componentesFigma = Get-ChildItem -Path "$figmaPath\src\app\components" -Filter "*.tsx" -File | 
    Where-Object { $_.Name -notmatch "^ui$" } |
    Select-Object -ExpandProperty Name

Write-Host "Total de componentes: $($componentesFigma.Count)" -ForegroundColor Cyan

# Categorizar componentes
$dialogs = $componentesFigma | Where-Object { $_ -like "Dialog*" }
$cards = $componentesFigma | Where-Object { $_ -like "Card*" }
$modulos = $componentesFigma | Where-Object { $_ -like "Modulo*" }
$outros = $componentesFigma | Where-Object { 
    $_ -notlike "Dialog*" -and 
    $_ -notlike "Card*" -and 
    $_ -notlike "Modulo*" 
}

Write-Host "`n  Dialogs: $($dialogs.Count)" -ForegroundColor Magenta
$dialogs | ForEach-Object { Write-Host "    - $_" -ForegroundColor Gray }

Write-Host "`n  Cards: $($cards.Count)" -ForegroundColor Magenta
$cards | ForEach-Object { Write-Host "    - $_" -ForegroundColor Gray }

Write-Host "`n  Módulos: $($modulos.Count)" -ForegroundColor Magenta
$modulos | ForEach-Object { Write-Host "    - $_" -ForegroundColor Gray }

Write-Host "`n  Outros: $($outros.Count)" -ForegroundColor Magenta
$outros | ForEach-Object { Write-Host "    - $_" -ForegroundColor Gray }

# ============================================
# PASSO 4: Copiar Componentes UI do Figma
# ============================================
Write-Host "`n📄 Passo 4: Copiando componentes UI extras do Figma..." -ForegroundColor Yellow

$uiFigma = Get-ChildItem -Path "$figmaPath\src\app\components\ui" -Filter "*.tsx" -File
$uiFrontend = Get-ChildItem -Path "$frontendPath\src\components\ui" -Filter "*.tsx" -File

$uiFaltantes = $uiFigma | Where-Object { 
    $_.Name -notin $uiFrontend.Name 
}

Write-Host "Componentes UI faltantes: $($uiFaltantes.Count)" -ForegroundColor Cyan
$uiFaltantes | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Gray }

# ============================================
# RESUMO
# ============================================
Write-Host "`n" + "=" * 50
Write-Host "📊 RESUMO DA FASE 0" -ForegroundColor Cyan
Write-Host "=" * 50

Write-Host @"

Para completar a Fase 0, execute manualmente:

1. INSTALAR COMPONENTES SHADCN/UI:
   cd $frontendPath
   npx shadcn@latest add accordion alert aspect-ratio breadcrumb carousel chart collapsible command context-menu drawer form hover-card input-otp menubar navigation-menu pagination radio-group resizable scroll-area separator sheet sidebar slider toggle toggle-group tooltip

2. INSTALAR DEPENDÊNCIAS EXTRAS:
   npm install sonner recharts embla-carousel-react cmdk input-otp vaul

3. COPIAR UTILS DO FIGMA:
   Copy-Item "$figmaPath\src\app\components\ui\utils.ts" -Destination "$frontendPath\src\lib\figma-utils.ts"

4. VERIFICAR BUILD:
   npm run build

"@ -ForegroundColor White

Write-Host "✅ Script de preparação concluído!" -ForegroundColor Green
