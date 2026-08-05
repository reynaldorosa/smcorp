# 🎯 Análise de Alinhamento: Sistema Atual vs. Especificação Figma

> **Data:** 03/02/2026  
> **Objetivo:** Alinhar o SMCORP com a lógica de Cascata de Dados da Figma

---

## 📊 Comparativo: Sistema Atual vs. Figma

### ✅ MÓDULO 00: Infraestrutura e Configurações Globais

| Recurso Figma | Status | Modelo Atual | Ajustes Necessários |
|---------------|--------|--------------|---------------------|
| **Dados Institucionais** | ⚠️ Parcial | Company, CompanySettings | ✅ Logo e identidade visual (JSON) |
| **Gestão de Salas** | ✅ Completo | Room (capacity, costPerDay, location) | ✅ Já implementado corretamente |
| **Instrutores** | ⚠️ Parcial | Instructor (dailyRate) | ❌ Falta: valor por tipo (Aula vs Prova) |
| **Usuários RBAC** | ⚠️ Parcial | User (role: 5 níveis) | ⚠️ Adicionar MASTER, ajustar roles |
| **Empresas PJ** | ✅ Completo | Company (cnpj, precificação) | ✅ Já implementado |
| **Custos Auditáveis** | ⚠️ Parcial | Cost (category, isRecurring) | ⚠️ Adicionar flag "auditável/fixo" |
| **Produtos Extras** | ✅ Completo | ExtraProduct (name, price, stock) | ✅ Já implementado |

---

### ❌ MÓDULO 01: DNA Técnico (Catálogo de Cursos)

| Recurso Figma | Status | Modelo Atual | Ajustes Necessários |
|---------------|--------|--------------|---------------------|
| **Identificação** | ✅ OK | Course (name, description) | ✅ Já tem |
| **Carga Horária Total** | ✅ OK | Course.durationHours | ✅ Já tem |
| **Horas de aula/dia** | ❌ Falta | - | ⚠️ Adicionar `hoursPerDay` |
| **Horários (Início/Fim)** | ❌ Falta | - | ⚠️ Adicionar `defaultStartTime`, `defaultEndTime` |
| **Intervalo (Pausa)** | ❌ Falta | - | ⚠️ Adicionar `breakDuration` (minutos) |
| **Seletor Fim de Semana** | ❌ Falta | - | ⚠️ Adicionar `allowWeekends` (boolean) |
| **Requisitos Matrícula** | ❌ Falta | - | ⚠️ Adicionar `requiredDocuments` (JSON array) |
| **Vínculo Custos** | ❌ Falta | - | ⚠️ Relação N:N com Cost (custos fixos do curso) |

**🔴 CRÍTICO:** Módulo 01 precisa de 6 novos campos + 1 relação!

---

### ⚠️ MÓDULO 02: Abertura e Instância de Turmas

| Recurso Figma | Status | Modelo Atual | Ajustes Necessários |
|---------------|--------|--------------|---------------------|
| **Automação de Agenda** | ⚠️ Lógica | Class (startDate, endDate) | ⚠️ Criar trigger/hook para calcular endDate |
| **Alocação de Sala** | ✅ OK | Class.roomId (FK) | ✅ Já tem |
| **Verificação de Conflito** | ❌ Falta | - | ⚠️ Criar validação de overlap de turmas/sala |
| **Preço por PJ** | ⚠️ Parcial | - | ⚠️ Adicionar `customPrice` em Class ou Enrollment |
| **Instrutor da Turma** | ⚠️ Texto | Class.instructorName (String) | ⚠️ Mudar para FK `instructorId` |

**🟡 ATENÇÃO:** Falta lógica de negócio para cálculo automático!

---

### 🔴 MÓDULO 03: Dashboard Operacional e Gestão de Alunos (CRÍTICO)

| Recurso Figma | Status | Modelo Atual | Ajustes Necessários |
|---------------|--------|--------------|---------------------|
| **Timeline Semanal** | ❌ UI | - | ⚠️ Frontend: componente de agenda |
| **Fluxo de Matrícula PF/PJ** | ⚠️ Parcial | Enrollment, Student | ✅ Estrutura básica OK |
| **Ajuste Comercial (Desconto)** | ❌ Falta | - | ⚠️ Adicionar `discount`, `approvedBy` em Enrollment |
| **Token de Matrícula** | ❌ Falta | - | ⚠️ Adicionar `enrollmentToken`, `tokenExpiresAt` |
| **Foto do Aluno** | ❌ Falta | - | ⚠️ Adicionar `photoUrl` em Student |
| **Status do Link** | ⚠️ Parcial | EnrollmentStatus (enum) | ⚠️ Ajustar: SCHEDULED→CONFIRMED→PRESENT |
| **[PAG] Status Pagamento** | ⚠️ Parcial | Payment (status) | ✅ Já implementado (PENDING/PAID) |
| **[DOC] Status Documentos** | ❌ Falta | - | ⚠️ Criar model `StudentDocument` |
| **[PROVA] Agendamento** | ❌ Falta | - | ⚠️ Criar model `Exam` (instructorId, date, number) |
| **Produtos Extras por Aluno** | ❌ Falta | - | ⚠️ Criar model `EnrollmentExtraProduct` (N:N) |

**🔴 CRÍTICO:** Módulo 03 é o coração do sistema e precisa de 8 novos recursos!

---

## 🗂️ Modelo de Dados Proposto (Ajustes)

### 1. Ajustes no Schema Existente

#### **User** (Módulo 00 - RBAC)
```prisma
enum UserRole {
  MASTER       // 🆕 Usuário com poderes de aprovação
  ADMIN        
  COLLABORATOR 
  CLIENT_PF    
  CLIENT_PJ    
  CLIENT_MOV   
}
```

#### **Instructor** (Módulo 00)
```prisma
model Instructor {
  // ... campos existentes
  classHourlyRate Decimal? @map("class_hourly_rate") @db.Decimal(10, 2)  // 🆕 Valor/hora aula
  examHourlyRate  Decimal? @map("exam_hourly_rate") @db.Decimal(10, 2)   // 🆕 Valor/hora prova
  
  classes         Class[]   // 🆕 Relação com turmas
  exams           Exam[]    // 🆕 Relação com provas
}
```

#### **Cost** (Módulo 00)
```prisma
model Cost {
  // ... campos existentes
  isAuditable     Boolean      @default(false) @map("is_auditable")  // 🆕 Flag de custo auditável
  
  courses         CourseCost[] // 🆕 Relação com cursos
}
```

#### **Course** (Módulo 01 - DNA Técnico) ⚠️ CRÍTICO
```prisma
model Course {
  // ... campos existentes
  
  // 🆕 Configuração de Tempo
  hoursPerDay      Int?       @map("hours_per_day")           // Horas de aula por dia
  defaultStartTime String?    @map("default_start_time")      // Ex: "08:00"
  defaultEndTime   String?    @map("default_end_time")        // Ex: "18:00"
  breakDuration    Int?       @default(60) @map("break_duration") // Minutos de intervalo
  allowWeekends    Boolean    @default(false) @map("allow_weekends")
  
  // 🆕 Requisitos e Custos
  requiredDocuments Json?     @map("required_documents")      // ["RG", "CPF", "ASO", ...]
  syllabus          String?   @db.Text                        // Conteúdo Programático
  
  costs             CourseCost[] // 🆕 Custos fixos vinculados
}
```

#### **Class** (Módulo 02)
```prisma
model Class {
  // ... campos existentes
  instructorId     String?    @map("instructor_id")  // 🆕 FK em vez de String
  customPrice      Decimal?   @map("custom_price") @db.Decimal(10, 2) // 🆕 Preço PJ
  companyId        String?    @map("company_id")    // 🆕 Turma fechada para empresa
  
  instructor       Instructor? @relation(fields: [instructorId], references: [id])
  company          Company?    @relation(fields: [companyId], references: [id])
  
  @@index([instructorId])
  @@index([companyId])
}
```

#### **Student** (Módulo 03)
```prisma
model Student {
  // ... campos existentes
  photoUrl         String?    @map("photo_url")       // 🆕 URL da foto do aluno
  address          String?
  city             String?
  state            String?
  zipCode          String?    @map("zip_code")
  
  documents        StudentDocument[]  // 🆕 Relação com documentos
}
```

#### **Enrollment** (Módulo 03) ⚠️ CRÍTICO
```prisma
model Enrollment {
  // ... campos existentes
  
  // 🆕 Token de Matrícula
  enrollmentToken  String?    @unique @map("enrollment_token")
  tokenExpiresAt   DateTime?  @map("token_expires_at")
  tokenUsedAt      DateTime?  @map("token_used_at")
  
  // 🆕 Ajuste Comercial
  discount         Decimal?   @default(0) @db.Decimal(10, 2)
  discountApprovedBy String? @map("discount_approved_by")  // FK para User (MASTER)
  
  // 🆕 Status Documentos
  documentsStatus  DocumentStatus @default(PENDING) @map("documents_status")
  
  approvedBy       User?      @relation("DiscountApprovals", fields: [discountApprovedBy], references: [id])
  extraProducts    EnrollmentExtraProduct[]
  
  @@index([enrollmentToken])
  @@index([documentsStatus])
}

enum DocumentStatus {
  PENDING    // Vermelho
  COMPLETE   // Verde
}
```

---

### 2. Novos Modelos Necessários

#### **CourseCost** (Módulo 01 - Vínculo Custos)
```prisma
model CourseCost {
  id        String   @id @default(uuid())
  courseId  String   @map("course_id")
  costId    String   @map("cost_id")
  createdAt DateTime @default(now()) @map("created_at")
  
  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  cost      Cost     @relation(fields: [costId], references: [id], onDelete: Cascade)
  
  @@unique([courseId, costId])
  @@index([courseId])
  @@index([costId])
  @@map("course_costs")
}
```

#### **StudentDocument** (Módulo 03 - [DOC])
```prisma
model StudentDocument {
  id          String          @id @default(uuid())
  studentId   String          @map("student_id")
  documentType String         @map("document_type")  // "RG", "CPF", "ASO", etc.
  fileUrl     String          @map("file_url")
  uploadedAt  DateTime        @default(now()) @map("uploaded_at")
  status      DocumentStatus  @default(PENDING)
  validatedBy String?         @map("validated_by")   // FK User
  validatedAt DateTime?       @map("validated_at")
  notes       String?
  createdAt   DateTime        @default(now()) @map("created_at")
  deletedAt   DateTime?       @map("deleted_at")
  
  student     Student         @relation(fields: [studentId], references: [id], onDelete: Cascade)
  validator   User?           @relation("DocumentValidations", fields: [validatedBy], references: [id])
  
  @@index([studentId])
  @@index([status])
  @@index([deletedAt])
  @@map("student_documents")
}
```

#### **Exam** (Módulo 03 - [PROVA])
```prisma
model Exam {
  id            String       @id @default(uuid())
  enrollmentId  String       @map("enrollment_id")
  instructorId  String       @map("instructor_id")
  examNumber    String       @map("exam_number")      // Número da prova
  scheduledDate DateTime     @map("scheduled_date")
  scheduledTime String       @map("scheduled_time")
  status        ExamStatus   @default(SCHEDULED)
  score         Decimal?     @db.Decimal(5, 2)        // Nota (0-100)
  notes         String?
  createdAt     DateTime     @default(now()) @map("created_at")
  updatedAt     DateTime     @updatedAt @map("updated_at")
  deletedAt     DateTime?    @map("deleted_at")
  
  enrollment    Enrollment   @relation(fields: [enrollmentId], references: [id])
  instructor    Instructor   @relation(fields: [instructorId], references: [id])
  
  @@index([enrollmentId])
  @@index([instructorId])
  @@index([scheduledDate])
  @@index([status])
  @@index([deletedAt])
  @@map("exams")
}

enum ExamStatus {
  SCHEDULED   // Agendado
  COMPLETED   // Realizado
  APPROVED    // Aprovado
  FAILED      // Reprovado
  CANCELLED   // Cancelado
}
```

#### **EnrollmentExtraProduct** (Módulo 03 - Venda Extra)
```prisma
model EnrollmentExtraProduct {
  id             String       @id @default(uuid())
  enrollmentId   String       @map("enrollment_id")
  extraProductId String       @map("extra_product_id")
  quantity       Int          @default(1)
  unitPrice      Decimal      @db.Decimal(10, 2) @map("unit_price")  // Preço no momento
  totalPrice     Decimal      @db.Decimal(10, 2) @map("total_price")
  createdAt      DateTime     @default(now()) @map("created_at")
  deletedAt      DateTime?    @map("deleted_at")
  
  enrollment     Enrollment   @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  extraProduct   ExtraProduct @relation(fields: [extraProductId], references: [id])
  
  @@index([enrollmentId])
  @@index([extraProductId])
  @@index([deletedAt])
  @@map("enrollment_extra_products")
}
```

---

## 🎯 Plano de Implementação Incremental

### **Fase 1: Ajustes no Módulo 00 e 01** (Prioridade: ALTA)
- [ ] Adicionar `MASTER` ao enum `UserRole`
- [ ] Adicionar campos de valor por tipo em `Instructor`
- [ ] Adicionar flag `isAuditable` em `Cost`
- [ ] Adicionar 6 campos no model `Course` (DNA Técnico)
- [ ] Criar model `CourseCost` (relação N:N)
- [ ] Criar migration

**Estimativa:** 2-3 horas

---

### **Fase 2: Ajustes no Módulo 02** (Prioridade: MÉDIA)
- [ ] Mudar `Class.instructorName` para FK `instructorId`
- [ ] Adicionar `customPrice` e `companyId` em `Class`
- [ ] Criar validação de conflito de agenda (service)
- [ ] Criar hook para cálculo automático de `endDate`
- [ ] Criar migration

**Estimativa:** 3-4 horas

---

### **Fase 3: Módulo 03 - Core do Sistema** (Prioridade: CRÍTICA)
- [ ] Adicionar `photoUrl` em `Student`
- [ ] Adicionar 4 campos em `Enrollment` (token, desconto, status docs)
- [ ] Criar model `StudentDocument`
- [ ] Criar model `Exam`
- [ ] Criar model `EnrollmentExtraProduct`
- [ ] Adicionar relações em `User` (approvals, validations)
- [ ] Adicionar relação em `ExtraProduct`
- [ ] Criar migration

**Estimativa:** 4-6 horas

---

### **Fase 4: Lógica de Negócio** (Prioridade: ALTA)
- [ ] Service para geração de `enrollmentToken`
- [ ] Validação de documentos (status vermelho/verde)
- [ ] Bloqueio de prova se documentos pendentes
- [ ] Sistema de aprovação de desconto (MASTER)
- [ ] Cálculo automático de data de término da turma
- [ ] Verificação de capacidade da sala

**Estimativa:** 8-10 horas

---

### **Fase 5: Frontend - Cards Interativos** (Prioridade: CRÍTICA)
- [ ] Timeline semanal (componente de agenda)
- [ ] Card do aluno com foto e botões [PAG], [DOC], [PROVA]
- [ ] Modal de documentos com visualização
- [ ] Modal de agendamento de prova
- [ ] Sistema de cores (Vermelho/Verde/Amarelo/Azul)
- [ ] Barra de progresso "Matrícula Concluída"

**Estimativa:** 10-12 horas

---

## 📈 Resumo de Impacto

| Módulo | Status Atual | Campos Novos | Models Novos | Prioridade |
|--------|--------------|--------------|--------------|------------|
| **M00** | 80% | 3 | 1 (CourseCost) | 🟡 MÉDIA |
| **M01** | 40% | 6 | 0 | 🔴 ALTA |
| **M02** | 60% | 3 | 0 | 🟡 MÉDIA |
| **M03** | 30% | 8 | 3 (StudentDocument, Exam, EnrollmentExtraProduct) | 🔴 CRÍTICA |

**Total:** 20 campos novos + 4 models novos + lógica de negócio

---

## ✅ Próximos Passos Recomendados

1. **IMEDIATO:** Criar migration para Fase 1 (M00 + M01)
2. **CURTO PRAZO:** Implementar Fase 2 e 3 (models do M03)
3. **MÉDIO PRAZO:** Desenvolver lógica de negócio (Fase 4)
4. **LONGO PRAZO:** Construir frontend interativo (Fase 5)

---

**Quer que eu comece a implementação pelas Fases 1 e 3 (schema + migrations)?**
