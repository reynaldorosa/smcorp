import {
  PrismaClient,
  UserRole,
  ClassStatus,
  EnrollmentStatus,
  DocumentStatus,
  ExamStatus,
  PaymentStatus,
  PaymentType,
  PaymentCategory,
  CostCategory,
  CostFrequency,
  CostLinkage,
  CostDueCriterion,
  CostEntryStatus,
  CRMContactSource,
  CRMContactStatus,
  CRMActivityType,
  CRMDealStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// ============================================
// SAAS MULTI-TENANT:
// O seed cria dados de exemplo sob o TENANT RAIZ (SMCORP),
// cujo UUID fixo é criado pela migração de multi-tenancy.
// Usuários MASTER (plataforma) permanecem sem tenant.
// ATENÇÃO: o seed limpa TODAS as tabelas — é uma ferramenta
// exclusivamente de desenvolvimento.
// ============================================
const ROOT_TENANT_ID = '00000000-0000-4000-8000-000000000001';

// Modelos sem coluna tenant_id (não recebem injeção)
const NON_TENANT_MODELS = ['Tenant', 'Subscription'];

prisma.$use(async (params, next) => {
  if (
    params.model &&
    !NON_TENANT_MODELS.includes(params.model) &&
    (params.action === 'create' || params.action === 'createMany' || params.action === 'upsert')
  ) {
    const isMasterUser =
      params.model === 'User' && (params.args?.data?.role === 'MASTER' || params.args?.create?.role === 'MASTER');

    if (!isMasterUser) {
      if (params.action === 'createMany') {
        const data = params.args?.data;
        if (Array.isArray(data)) {
          params.args.data = data.map((item) => ({ ...item, tenantId: ROOT_TENANT_ID }));
        } else if (data && typeof data === 'object') {
          params.args.data = { ...data, tenantId: ROOT_TENANT_ID };
        }
      } else if (params.action === 'upsert') {
        params.args.create = { ...(params.args?.create || {}), tenantId: ROOT_TENANT_ID };
        params.args.update = { ...(params.args?.update || {}), tenantId: ROOT_TENANT_ID };
      } else {
        params.args.data = { ...(params.args?.data || {}), tenantId: ROOT_TENANT_ID };
      }
    }
  }
  return next(params);
});

// Helpers
function generateToken(): string {
  return randomBytes(16).toString('hex').toUpperCase();
}

function generateStudentCode(index: number): string {
  return `A${String(index).padStart(4, '0')}`;
}

function generateExamCode(index: number): string {
  return `P${String(index).padStart(4, '0')}`;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomPhone(): string {
  const ddd = ['21', '11', '31', '41', '51', '61', '71', '81'][Math.floor(Math.random() * 8)];
  const num = Math.floor(90000000 + Math.random() * 9999999);
  return `(${ddd}) 9${num}`;
}

function randomCPF(): string {
  const nums = Array.from({ length: 11 }, () => Math.floor(Math.random() * 10));
  return `${nums.slice(0, 3).join('')}.${nums.slice(3, 6).join('')}.${nums.slice(6, 9).join('')}-${nums.slice(9).join('')}`;
}

async function main() {
  console.log('🌱 Starting comprehensive seed...');
  console.log('');

  // Limpar dados existentes (em ordem de dependência)
  console.log('🗑️  Clearing existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.cRMDeal.deleteMany();
  await prisma.cRMActivity.deleteMany();
  await prisma.cRMPipelineStage.deleteMany();
  await prisma.cRMContact.deleteMany();
  await prisma.costEntry.deleteMany();
  await prisma.enrollmentExtraProduct.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.studentDocument.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.certificateTemplate.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.class.deleteMany();
  await prisma.courseCost.deleteMany();
  await prisma.costCriterion.deleteMany();
  await prisma.cost.deleteMany();
  await prisma.student.deleteMany();
  await prisma.extraProduct.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.instructor.deleteMany();
  await prisma.room.deleteMany();
  await prisma.course.deleteMany();
  await prisma.companySettings.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');
  console.log('');

  // ============================================
  // TENANT RAIZ (idempotente — a migração de
  // multi-tenancy também o cria)
  // ============================================
  await prisma.tenant.upsert({
    where: { id: ROOT_TENANT_ID },
    update: { name: 'SMCORP', status: 'ACTIVE' },
    create: {
      id: ROOT_TENANT_ID,
      slug: 'smcorp',
      name: 'SMCORP',
      status: 'ACTIVE',
      branding: {},
    },
  });
  console.log('🏢 Tenant raiz SMCORP garantido');

  // ============================================
  // USUÁRIOS (credenciais configuráveis via ENV)
  // ============================================
  console.log('👤 Creating users...');
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && (!process.env.ADMIN_PASSWORD || !process.env.MASTER_PASSWORD || !process.env.MASTER_PIN)) {
    // Fail-fast: em produção, credenciais iniciais do MASTER/ADMIN e o PIN que
    // autoriza pagamentos nunca podem cair nos defaults fracos de dev
    // ('Admin@123' / '123456') — mesma lógica do EncryptionService.
    throw new Error(
      'ADMIN_PASSWORD, MASTER_PASSWORD e MASTER_PIN são obrigatórios em produção (SEED_ON_STARTUP=true).',
    );
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@smcorp.com.br';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const masterEmail = process.env.MASTER_EMAIL || 'master@smcorp.com.br';
  const masterPassword = process.env.MASTER_PASSWORD || adminPassword;
  const masterPin = process.env.MASTER_PIN || '123456';
  console.log(`   📧 Master email: ${masterEmail}`);
  console.log(`   📧 Admin email:  ${adminEmail}`);

  const hashedMasterPassword = await bcrypt.hash(masterPassword, 12);
  const hashedMasterPin = await bcrypt.hash(masterPin, 12);
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);
  
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: masterEmail,
        password: hashedMasterPassword,
        masterPinHash: hashedMasterPin,
        name: 'Usuário Master',
        role: UserRole.MASTER,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedAdminPassword,
        name: 'Administrador',
        role: UserRole.ADMIN,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'colaborador@smcorp.com.br',
        password: await bcrypt.hash('Colab@123', 12),
        name: 'Maria Colaboradora',
        role: UserRole.COLLABORATOR,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'colaborador2@smcorp.com.br',
        password: await bcrypt.hash('Colab@123', 12),
        name: 'João Colaborador',
        role: UserRole.COLLABORATOR,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'cliente.pf@example.com',
        password: await bcrypt.hash('Cliente@123', 12),
        name: 'Carlos Cliente PF',
        role: UserRole.CLIENT_PF,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'cliente.pj@example.com',
        password: await bcrypt.hash('Cliente@123', 12),
        name: 'Empresa Cliente PJ',
        role: UserRole.CLIENT_PJ,
        isActive: true,
      },
    }),
  ]);
  console.log(`   ✅ Created ${users.length} users`);

  // ============================================
  // EMPRESAS PARCEIRAS
  // ============================================
  console.log('🏢 Creating companies...');
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        name: 'Petrobras S.A.',
        tradeName: 'Petrobras',
        cnpj: '33.000.167/0001-01',
        email: 'treinamentos@petrobras.com.br',
        phone: '(21) 3224-1234',
        address: 'Av. República do Chile, 65',
        city: 'Rio de Janeiro',
        state: 'RJ',
        zipCode: '20031-912',
        isActive: true,
      },
    }),
    prisma.company.create({
      data: {
        name: 'Shell Brasil Ltda',
        tradeName: 'Shell',
        cnpj: '10.456.789/0001-00',
        email: 'training@shell.com.br',
        phone: '(11) 3456-7890',
        address: 'Av. Paulista, 1500',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100',
        isActive: true,
      },
    }),
    prisma.company.create({
      data: {
        name: 'Chevron Brasil',
        tradeName: 'Chevron',
        cnpj: '20.123.456/0001-00',
        email: 'rh@chevron.com.br',
        phone: '(21) 3789-0123',
        address: 'Av. Atlântica, 1000',
        city: 'Rio de Janeiro',
        state: 'RJ',
        zipCode: '22021-000',
        isActive: true,
      },
    }),
    prisma.company.create({
      data: {
        name: 'Equinor Brasil',
        tradeName: 'Equinor',
        cnpj: '30.987.654/0001-00',
        email: 'capacitacao@equinor.com.br',
        phone: '(21) 3012-3456',
        address: 'Av. Rio Branco, 500',
        city: 'Rio de Janeiro',
        state: 'RJ',
        zipCode: '20040-020',
        isActive: true,
      },
    }),
    prisma.company.create({
      data: {
        name: 'TotalEnergies Brasil',
        tradeName: 'TotalEnergies',
        cnpj: '40.111.222/0001-33',
        email: 'formacao@total.com.br',
        phone: '(21) 3111-2222',
        address: 'Rua do Ouvidor, 200',
        city: 'Rio de Janeiro',
        state: 'RJ',
        zipCode: '20040-030',
        isActive: true,
      },
    }),
  ]);
  console.log(`   ✅ Created ${companies.length} companies`);

  // ============================================
  // CONFIGURAÇÕES DAS EMPRESAS
  // ============================================
  console.log('⚙️  Creating company settings...');
  const companySettings = await Promise.all(
    companies.map((company) =>
      prisma.companySettings.create({
        data: {
          companyId: company.id,
          settings: {
            bank: {
              name: 'Banco do Brasil',
              agency: '1234-5',
              account: '12345-6',
              pix: company.cnpj,
            },
            smtp: {
              enabled: true,
              host: 'smtp.gmail.com',
              port: 587,
              user: `notifications@${company.tradeName?.toLowerCase() || 'company'}.com.br`,
            },
            whatsapp: {
              enabled: false,
              phone: company.phone,
            },
            notifications: {
              emailOnEnrollment: true,
              smsOnExam: false,
              reminderDays: 3,
              preferredChannel: 'email',
              allowWhatsappFallback: true,
            },
          },
        },
      })
    )
  );
  console.log(`   ✅ Created ${companySettings.length} company settings`);

  // ============================================
  // SALAS
  // ============================================
  console.log('🚪 Creating rooms...');
  const rooms = await Promise.all([
    prisma.room.create({
      data: {
        name: 'Sala de Treinamento 01',
        code: 'SALA-01',
        block: 'A',
        capacity: 25,
        costPerDay: 500.00,
        location: 'Bloco A - Térreo',
        hasAC: true,
        hasProjector: true,
        isActive: true,
      },
    }),
    prisma.room.create({
      data: {
        name: 'Sala de Treinamento 02',
        code: 'SALA-02',
        block: 'A',
        capacity: 30,
        costPerDay: 600.00,
        location: 'Bloco A - 1º Andar',
        hasAC: true,
        hasProjector: true,
        isActive: true,
      },
    }),
    prisma.room.create({
      data: {
        name: 'Laboratório Prático',
        code: 'LAB-01',
        block: 'B',
        capacity: 20,
        costPerDay: 800.00,
        location: 'Bloco B - Térreo',
        hasAC: true,
        hasProjector: false,
        isActive: true,
      },
    }),
    prisma.room.create({
      data: {
        name: 'Campo de Treinamento',
        code: 'CAMPO-01',
        block: 'C',
        capacity: 50,
        costPerDay: 1500.00,
        location: 'Área Externa',
        hasAC: false,
        hasProjector: false,
        isActive: true,
      },
    }),
    prisma.room.create({
      data: {
        name: 'Auditório Principal',
        code: 'AUD-01',
        block: 'A',
        capacity: 100,
        costPerDay: 2000.00,
        location: 'Bloco A - 2º Andar',
        hasAC: true,
        hasProjector: true,
        isActive: true,
      },
    }),
  ]);
  console.log(`   ✅ Created ${rooms.length} rooms`);

  // ============================================
  // INSTRUTORES
  // ============================================
  console.log('👨‍🏫 Creating instructors...');
  const instructors = await Promise.all([
    prisma.instructor.create({
      data: {
        name: 'Carlos Eduardo Silva',
        cpf: '123.456.789-00',
        email: 'carlos.silva@smcorp.com.br',
        phone: '(21) 98765-4321',
        specialties: ['NR-35', 'Trabalho em Altura', 'Resgate'],
        classHourlyRate: 150.00,
        examHourlyRate: 200.00,
        isActive: true,
      },
    }),
    prisma.instructor.create({
      data: {
        name: 'Maria Fernanda Santos',
        cpf: '234.567.890-11',
        email: 'maria.santos@smcorp.com.br',
        phone: '(21) 98765-4322',
        specialties: ['Acesso por Corda', 'IRATA', 'Resgate Vertical'],
        classHourlyRate: 180.00,
        examHourlyRate: 250.00,
        isActive: true,
      },
    }),
    prisma.instructor.create({
      data: {
        name: 'João Pedro Oliveira',
        cpf: '345.678.901-22',
        email: 'joao.oliveira@smcorp.com.br',
        phone: '(21) 98765-4323',
        specialties: ['Soldagem', 'NR-34', 'Trabalho a Quente'],
        classHourlyRate: 140.00,
        examHourlyRate: 180.00,
        isActive: true,
      },
    }),
    prisma.instructor.create({
      data: {
        name: 'Ana Carolina Lima',
        cpf: '456.789.012-33',
        email: 'ana.lima@smcorp.com.br',
        phone: '(21) 98765-4324',
        specialties: ['Pintura Industrial', 'Jateamento', 'Tratamento de Superfície'],
        classHourlyRate: 130.00,
        examHourlyRate: 170.00,
        isActive: true,
      },
    }),
    prisma.instructor.create({
      data: {
        name: 'Roberto Machado',
        cpf: '567.890.123-44',
        email: 'roberto.machado@smcorp.com.br',
        phone: '(21) 98765-4325',
        specialties: ['Espaço Confinado', 'NR-33', 'Atmosferas IPVS'],
        classHourlyRate: 160.00,
        examHourlyRate: 220.00,
        isActive: true,
      },
    }),
  ]);
  console.log(`   ✅ Created ${instructors.length} instructors`);

  // ============================================
  // CURSOS
  // ============================================
  console.log('📚 Creating courses...');
  const courses = await Promise.all([
    prisma.course.create({
      data: {
        name: 'NR-35 - Trabalho em Altura',
        code: 'NR35-B',
        description: 'Treinamento básico para trabalho em altura conforme NR-35',
        syllabus: `1. Normas e regulamentos aplicáveis
2. Análise de Risco e condições impeditivas
3. Riscos potenciais inerentes ao trabalho em altura
4. Sistemas, equipamentos e procedimentos de proteção coletiva
5. Equipamentos de Proteção Individual
6. Acidentes típicos em trabalhos em altura
7. Condutas em situações de emergência
8. Avaliação prática`,
        durationHours: 8,
        hoursPerDay: 8,
        defaultStartTime: '08:00',
        defaultEndTime: '17:00',
        breakDuration: 60,
        allowWeekends: false,
        requiredDocuments: ['RG', 'CPF', 'ASO', 'Foto 3x4'],
        learningTime: 8,
        certificationInfo: 'Certificado válido por 2 anos conforme NR-35',
        prerequisites: ['Maior de 18 anos', 'ASO apto para trabalho em altura'],
        price: 350.00,
        validityMonths: 24,
        isOffshore: true,
        isActive: true,
      },
    }),
    prisma.course.create({
      data: {
        name: 'Acesso por Corda - Nível 1',
        code: 'ROPE-N1',
        description: 'Formação inicial em técnicas de acesso por corda conforme IRATA',
        syllabus: `1. Introdução ao Acesso por Corda
2. Equipamentos e inspeção
3. Nós e ancoragens
4. Técnicas de progressão
5. Posicionamento de trabalho
6. Procedimentos de resgate básico
7. Prática supervisionada`,
        durationHours: 40,
        hoursPerDay: 8,
        defaultStartTime: '07:00',
        defaultEndTime: '16:00',
        breakDuration: 60,
        allowWeekends: false,
        requiredDocuments: ['RG', 'CPF', 'ASO', 'Foto 3x4', 'Comprovante NR-35'],
        learningTime: 40,
        certificationInfo: 'Certificação IRATA Nível 1 - válida por 3 anos',
        prerequisites: ['NR-35 válido', 'Aptidão física', 'Maior de 18 anos'],
        price: 2500.00,
        validityMonths: 36,
        isOffshore: true,
        isActive: true,
      },
    }),
    prisma.course.create({
      data: {
        name: 'Soldagem MIG/MAG',
        code: 'SOLD-MIG',
        description: 'Curso de soldagem com processo MIG/MAG para iniciantes e reciclagem',
        syllabus: `1. Fundamentos de soldagem
2. Processo MIG/MAG
3. Consumíveis e gases
4. Parâmetros de soldagem
5. Técnicas operatórias
6. Descontinuidades e defeitos
7. Segurança e EPI
8. Prática intensiva`,
        durationHours: 80,
        hoursPerDay: 8,
        defaultStartTime: '07:00',
        defaultEndTime: '16:00',
        breakDuration: 60,
        allowWeekends: false,
        requiredDocuments: ['RG', 'CPF', 'ASO'],
        learningTime: 80,
        certificationInfo: 'Certificado FBTS válido por 5 anos',
        prerequisites: ['Ensino fundamental completo'],
        price: 1800.00,
        validityMonths: 60,
        isOffshore: false,
        isActive: true,
      },
    }),
    prisma.course.create({
      data: {
        name: 'Pintura Industrial',
        code: 'PINT-IND',
        description: 'Formação em técnicas de pintura industrial e tratamento de superfície',
        syllabus: `1. Corrosão e proteção
2. Preparação de superfície
3. Jateamento abrasivo
4. Tintas e vernizes
5. Técnicas de aplicação
6. Controle de qualidade
7. Normas e especificações`,
        durationHours: 40,
        hoursPerDay: 8,
        defaultStartTime: '08:00',
        defaultEndTime: '17:00',
        breakDuration: 60,
        allowWeekends: false,
        requiredDocuments: ['RG', 'CPF', 'ASO'],
        learningTime: 40,
        certificationInfo: 'Certificado válido por 3 anos',
        prerequisites: [],
        price: 1200.00,
        validityMonths: 36,
        isOffshore: false,
        isActive: true,
      },
    }),
    prisma.course.create({
      data: {
        name: 'NR-33 - Espaço Confinado',
        code: 'NR33-B',
        description: 'Capacitação para trabalho em espaços confinados',
        syllabus: `1. Definições e reconhecimento
2. Riscos atmosféricos
3. Procedimentos de entrada
4. Monitoramento e ventilação
5. Equipamentos de proteção
6. Resgate e emergências
7. PET e APR`,
        durationHours: 16,
        hoursPerDay: 8,
        defaultStartTime: '08:00',
        defaultEndTime: '17:00',
        breakDuration: 60,
        allowWeekends: false,
        requiredDocuments: ['RG', 'CPF', 'ASO'],
        learningTime: 16,
        certificationInfo: 'Certificado válido por 1 ano conforme NR-33',
        prerequisites: ['Maior de 18 anos'],
        price: 550.00,
        validityMonths: 12,
        isOffshore: true,
        isActive: true,
      },
    }),
    prisma.course.create({
      data: {
        name: 'NR-34 - Trabalho a Quente',
        code: 'NR34-B',
        description: 'Condições e meio ambiente de trabalho na indústria da construção e reparação naval',
        syllabus: `1. Aplicação da NR-34
2. Trabalho a quente
3. Trabalho em altura (naval)
4. Espaços confinados (naval)
5. Movimentação de cargas
6. EPIs específicos`,
        durationHours: 8,
        hoursPerDay: 8,
        defaultStartTime: '08:00',
        defaultEndTime: '17:00',
        breakDuration: 60,
        allowWeekends: false,
        requiredDocuments: ['RG', 'CPF', 'ASO'],
        learningTime: 8,
        certificationInfo: 'Certificado válido por 2 anos',
        prerequisites: [],
        price: 400.00,
        validityMonths: 24,
        isOffshore: true,
        isActive: true,
      },
    }),
  ]);
  console.log(`   ✅ Created ${courses.length} courses`);

  // ============================================
  // CUSTOS OPERACIONAIS
  // ============================================
  console.log('💰 Creating costs...');
  const now = new Date();
  const costs = await Promise.all([
    prisma.cost.create({
      data: {
        category: CostCategory.FIXED,
        description: 'Aluguel do Prédio Principal',
        amount: 15000.00,
        period: now,
        isRecurring: true,
        isAuditable: false,
      },
    }),
    prisma.cost.create({
      data: {
        category: CostCategory.FIXED,
        description: 'Energia Elétrica',
        amount: 3500.00,
        period: now,
        isRecurring: true,
        isAuditable: false,
      },
    }),
    prisma.cost.create({
      data: {
        category: CostCategory.PERSONNEL,
        description: 'Folha de Pagamento - Administrativo',
        amount: 25000.00,
        period: now,
        isRecurring: true,
        isAuditable: false,
      },
    }),
    prisma.cost.create({
      data: {
        category: CostCategory.MATERIAL,
        description: 'Material Didático - NR-35',
        amount: 50.00,
        period: now,
        isRecurring: false,
        isAuditable: true,
        notes: 'Custo por aluno para apostila e material',
      },
    }),
    prisma.cost.create({
      data: {
        category: CostCategory.MATERIAL,
        description: 'Material de Soldagem - Consumíveis',
        amount: 200.00,
        period: now,
        isRecurring: false,
        isAuditable: true,
        notes: 'Arame, gás e eletrodos por aluno',
      },
    }),
    prisma.cost.create({
      data: {
        category: CostCategory.EQUIPMENT,
        description: 'Manutenção Equipamentos de Altura',
        amount: 2500.00,
        period: now,
        isRecurring: true,
        isAuditable: true,
        notes: 'Inspeção e manutenção mensal',
      },
    }),
    prisma.cost.create({
      data: {
        category: CostCategory.INFRASTRUCTURE,
        description: 'Manutenção Campo de Treinamento',
        amount: 5000.00,
        period: now,
        isRecurring: true,
        isAuditable: false,
      },
    }),
    prisma.cost.create({
      data: {
        category: CostCategory.SERVICES,
        description: 'Certificadora Externa',
        amount: 30.00,
        period: now,
        isRecurring: false,
        isAuditable: true,
        notes: 'Taxa por certificado emitido',
      },
    }),
  ]);
  console.log(`   ✅ Created ${costs.length} costs`);

  // ============================================
  // VÍNCULO CURSO-CUSTO (Custos Auditáveis)
  // ============================================
  console.log('🔗 Linking courses to costs...');
  const auditableCosts = costs.filter((c) => c.isAuditable);
  const courseCosts = [];
  
  // NR-35 usa material didático e certificadora
  courseCosts.push(
    prisma.courseCost.create({ data: { courseId: courses[0].id, costId: auditableCosts[0].id } }),
    prisma.courseCost.create({ data: { courseId: courses[0].id, costId: auditableCosts[3].id } })
  );
  
  // Soldagem usa material de consumíveis e manutenção
  courseCosts.push(
    prisma.courseCost.create({ data: { courseId: courses[2].id, costId: auditableCosts[1].id } }),
    prisma.courseCost.create({ data: { courseId: courses[2].id, costId: auditableCosts[2].id } })
  );
  
  // Acesso por Corda usa manutenção de equipamentos
  courseCosts.push(
    prisma.courseCost.create({ data: { courseId: courses[1].id, costId: auditableCosts[2].id } }),
    prisma.courseCost.create({ data: { courseId: courses[1].id, costId: auditableCosts[3].id } })
  );

  await Promise.all(courseCosts);
  console.log(`   ✅ Created ${courseCosts.length} course-cost links`);

  // ============================================
  // CRITÉRIOS DE CUSTO (M08)
  // ============================================
  console.log('📐 Creating cost criteria...');
  const costCriteria = await Promise.all([
    prisma.costCriterion.create({
      data: {
        code: 'CR0001',
        name: 'Custo por aluno matriculado',
        frequency: CostFrequency.ONE_TIME,
        linkage: CostLinkage.ENROLLED_STUDENT,
        dueCriterion: CostDueCriterion.COURSE_END_DATE,
        isActive: true,
        notes: 'Aplicado quando houver aluno vinculado na matrícula.',
      },
    }),
    prisma.costCriterion.create({
      data: {
        code: 'CR0002',
        name: 'Custo mensal administrativo',
        frequency: CostFrequency.MONTHLY,
        linkage: CostLinkage.NOT_LINKED,
        dueCriterion: CostDueCriterion.MONTHLY_CLOSING,
        monthlyClosingDay: 5,
        daysAfterClosing: 2,
        isActive: true,
        notes: 'Fechamento mensal para custos recorrentes.',
      },
    }),
    prisma.costCriterion.create({
      data: {
        code: 'CR0003',
        name: 'Custo de instrutor por prova',
        frequency: CostFrequency.ONE_TIME,
        linkage: CostLinkage.INSTRUCTOR,
        dueCriterion: CostDueCriterion.THIRTY_DAYS_AFTER_END,
        isActive: true,
        notes: 'Pagamento de instrutor após conclusão da turma.',
      },
    }),
    prisma.costCriterion.create({
      data: {
        code: 'CR0004',
        name: 'Custo diário operacional',
        frequency: CostFrequency.DAILY,
        linkage: CostLinkage.NOT_LINKED,
        dueCriterion: CostDueCriterion.SPECIFIC_DATE,
        daysUntilDue: 1,
        isActive: true,
        notes: 'Lançamento diário com vencimento no dia seguinte.',
      },
    }),
  ]);
  console.log(`   ✅ Created ${costCriteria.length} cost criteria`);

  // ============================================
  // PRODUTOS EXTRAS
  // ============================================
  console.log('🛒 Creating extra products...');
  const products = await Promise.all([
    prisma.extraProduct.create({
      data: {
        name: 'Cinto de Segurança Paraquedista',
        description: 'Cinto paraquedista 5 pontos para trabalho em altura',
        price: 450.00,
        stock: 50,
        isActive: true,
      },
    }),
    prisma.extraProduct.create({
      data: {
        name: 'Capacete de Segurança com Jugular',
        description: 'Capacete classe B com jugular e slots para acessórios',
        price: 120.00,
        stock: 100,
        isActive: true,
      },
    }),
    prisma.extraProduct.create({
      data: {
        name: 'Óculos de Proteção Ampla Visão',
        description: 'Óculos ampla visão antiembaçante e anti-risco',
        price: 45.00,
        stock: 200,
        isActive: true,
      },
    }),
    prisma.extraProduct.create({
      data: {
        name: 'Luvas de Couro Vaqueta',
        description: 'Luvas de couro vaqueta para soldagem e trabalhos pesados',
        price: 35.00,
        stock: 150,
        isActive: true,
      },
    }),
    prisma.extraProduct.create({
      data: {
        name: 'Máscara de Solda Automática',
        description: 'Máscara de solda com escurecimento automático DIN 9-13',
        price: 280.00,
        stock: 30,
        isActive: true,
      },
    }),
    prisma.extraProduct.create({
      data: {
        name: 'Apostila NR-35 Completa',
        description: 'Material didático completo do curso NR-35',
        price: 25.00,
        stock: 500,
        isActive: true,
      },
    }),
    prisma.extraProduct.create({
      data: {
        name: 'Kit EPI Básico',
        description: 'Kit com capacete, óculos, luvas e protetor auricular',
        price: 180.00,
        stock: 80,
        isActive: true,
      },
    }),
    prisma.extraProduct.create({
      data: {
        name: 'Talabarte Duplo Y',
        description: 'Talabarte Y com absorvedor de energia e ganchos dupla trava',
        price: 320.00,
        stock: 40,
        isActive: true,
      },
    }),
    prisma.extraProduct.create({
      data: {
        name: 'Trava-Quedas Retrátil 3m',
        description: 'Trava-quedas retrátil com cabo de aço de 3 metros',
        price: 850.00,
        stock: 20,
        isActive: true,
      },
    }),
    prisma.extraProduct.create({
      data: {
        name: 'Detector de Gases 4 em 1',
        description: 'Detector portátil O2, LEL, CO, H2S',
        price: 2500.00,
        stock: 10,
        isActive: true,
      },
    }),
  ]);
  console.log(`   ✅ Created ${products.length} extra products`);

  // ============================================
  // FORNECEDORES
  // ============================================
  console.log('🏭 Creating suppliers...');
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: '3M do Brasil Ltda',
        tradeName: '3M',
        cnpj: '45.985.371/0001-08',
        email: 'vendas@3m.com.br',
        phone: '(11) 3683-1234',
        address: 'Rod. Anhanguera, km 110',
        category: 'EPIs e Segurança',
        isActive: true,
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Honeywell Safety Products',
        tradeName: 'Honeywell',
        cnpj: '52.154.842/0001-20',
        email: 'comercial@honeywell.com.br',
        phone: '(11) 4534-5678',
        address: 'Av. das Nações Unidas, 12901',
        category: 'Equipamentos de Segurança',
        isActive: true,
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Lincoln Electric Brasil',
        tradeName: 'Lincoln Electric',
        cnpj: '61.120.544/0001-89',
        email: 'vendas@lincolnelectric.com.br',
        phone: '(11) 3526-9000',
        address: 'Av. Bernardino de Campos, 98',
        category: 'Soldagem',
        isActive: true,
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Petzl Brasil',
        tradeName: 'Petzl',
        cnpj: '08.765.432/0001-11',
        email: 'pro@petzl.com.br',
        phone: '(21) 3456-7890',
        address: 'Rua Voluntários da Pátria, 400',
        category: 'Acesso por Corda',
        isActive: true,
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'MSA Safety',
        tradeName: 'MSA',
        cnpj: '07.543.321/0001-99',
        email: 'brasil@msasafety.com',
        phone: '(11) 4070-5600',
        address: 'Alameda Santos, 2000',
        category: 'Detecção de Gases',
        isActive: true,
      },
    }),
  ]);
  console.log(`   ✅ Created ${suppliers.length} suppliers`);

  // ============================================
  // ALUNOS
  // ============================================
  console.log('🎓 Creating students...');
  const studentNames = [
    'Pedro Henrique Almeida', 'Fernanda Costa Silva', 'Lucas Rodrigues Santos',
    'Juliana Martins Pereira', 'Rafael Oliveira Lima', 'Camila Souza Ferreira',
    'Bruno Carvalho Gomes', 'Amanda Ribeiro Dias', 'Thiago Nascimento Castro',
    'Larissa Mendes Barbosa', 'Gabriel Santos Rocha', 'Beatriz Lima Cardoso',
    'Matheus Fernandes Cruz', 'Carolina Alves Nunes', 'Diego Pereira Monteiro',
    'Mariana Costa Araújo', 'Leonardo Silva Teixeira', 'Isabela Gomes Correia',
    'Felipe Rodrigues Moraes', 'Natália Martins Lopes', 'Gustavo Almeida Pinto',
    'Aline Souza Mendes', 'Ricardo Carvalho Dias', 'Vanessa Oliveira Costa',
    'André Santos Vieira', 'Patrícia Lima Ferreira', 'Marcelo Ribeiro Silva',
    'Daniela Nascimento Rocha', 'Eduardo Fernandes Gomes', 'Cristiane Alves Barbosa',
  ];

  const students = await Promise.all(
    studentNames.map((name, index) =>
      prisma.student.create({
        data: {
          code: generateStudentCode(index + 1),
          name,
          cpf: randomCPF(),
          email: `${name.toLowerCase().replace(/ /g, '.').normalize('NFD').replace(/[\u0300-\u036f]/g, '')}@example.com`,
          phone: randomPhone(),
          birthDate: randomDate(new Date(1980, 0, 1), new Date(2000, 11, 31)),
          companyId: companies[index % companies.length].id,
          address: `Rua Exemplo, ${100 + index}`,
          city: ['Rio de Janeiro', 'São Paulo', 'Niterói', 'Santos', 'Macaé'][index % 5],
          state: ['RJ', 'SP', 'RJ', 'SP', 'RJ'][index % 5],
          zipCode: `${20000 + index * 100}-000`,
          isActive: true,
        },
      })
    )
  );
  console.log(`   ✅ Created ${students.length} students`);

  // ============================================
  // TURMAS
  // ============================================
  console.log('📅 Creating classes...');
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const twoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  const classes = await Promise.all([
    // Turmas futuras (agendadas)
    prisma.class.create({
      data: {
        code: 'NR35-2026-001',
        displayName: 'NR-35 Turma A - Fevereiro',
        courseId: courses[0].id,
        roomId: rooms[0].id,
        instructorId: instructors[0].id,
        startDate: nextWeek,
        endDate: nextWeek,
        startTime: '08:00',
        endTime: '17:00',
        maxStudents: 25,
        status: ClassStatus.SCHEDULED,
      },
    }),
    prisma.class.create({
      data: {
        code: 'NR35-2026-002',
        displayName: 'NR-35 Turma B - Março',
        courseId: courses[0].id,
        roomId: rooms[1].id,
        instructorId: instructors[0].id,
        startDate: nextMonth,
        endDate: nextMonth,
        startTime: '08:00',
        endTime: '17:00',
        maxStudents: 30,
        status: ClassStatus.SCHEDULED,
      },
    }),
    prisma.class.create({
      data: {
        code: 'ROPE-2026-001',
        displayName: 'Acesso por Corda N1 - Fevereiro',
        courseId: courses[1].id,
        roomId: rooms[2].id,
        instructorId: instructors[1].id,
        startDate: nextWeek,
        endDate: new Date(nextWeek.getTime() + 5 * 24 * 60 * 60 * 1000),
        startTime: '07:00',
        endTime: '16:00',
        maxStudents: 20,
        status: ClassStatus.SCHEDULED,
      },
    }),
    prisma.class.create({
      data: {
        code: 'SOLD-2026-001',
        displayName: 'Soldagem MIG/MAG - Turma 1',
        courseId: courses[2].id,
        roomId: rooms[2].id,
        instructorId: instructors[2].id,
        startDate: twoWeeks,
        endDate: new Date(twoWeeks.getTime() + 10 * 24 * 60 * 60 * 1000),
        startTime: '07:00',
        endTime: '16:00',
        maxStudents: 15,
        status: ClassStatus.SCHEDULED,
      },
    }),
    // Turma em andamento
    prisma.class.create({
      data: {
        code: 'NR33-2026-001',
        displayName: 'NR-33 Espaço Confinado',
        courseId: courses[4].id,
        roomId: rooms[0].id,
        instructorId: instructors[4].id,
        startDate: yesterday,
        endDate: today,
        startTime: '08:00',
        endTime: '17:00',
        maxStudents: 20,
        status: ClassStatus.IN_PROGRESS,
      },
    }),
    // Turma concluída
    prisma.class.create({
      data: {
        code: 'NR35-2026-000',
        displayName: 'NR-35 Janeiro',
        courseId: courses[0].id,
        roomId: rooms[0].id,
        instructorId: instructors[0].id,
        startDate: lastWeek,
        endDate: lastWeek,
        startTime: '08:00',
        endTime: '17:00',
        maxStudents: 25,
        status: ClassStatus.COMPLETED,
      },
    }),
    // Turma fechada para empresa (Petrobras)
    prisma.class.create({
      data: {
        code: 'NR35-PET-001',
        displayName: 'NR-35 Petrobras - Fechada',
        courseId: courses[0].id,
        roomId: rooms[1].id,
        instructorId: instructors[0].id,
        companyId: companies[0].id,
        customPrice: 300.00,
        startDate: twoWeeks,
        endDate: twoWeeks,
        startTime: '08:00',
        endTime: '17:00',
        maxStudents: 30,
        status: ClassStatus.SCHEDULED,
      },
    }),
  ]);
  console.log(`   ✅ Created ${classes.length} classes`);

  // ============================================
  // MATRÍCULAS
  // ============================================
  console.log('📝 Creating enrollments...');
  const enrollments = [];

  // 10 matrículas para turma em andamento (NR-33)
  for (let i = 0; i < 10; i++) {
    const token = generateToken();
    enrollments.push(
      prisma.enrollment.create({
        data: {
          studentId: students[i].id,
          classId: classes[4].id, // NR-33 em andamento
          status: i < 8 ? EnrollmentStatus.PRESENT : EnrollmentStatus.CONFIRMED,
          enrollmentToken: token,
          tokenUsedAt: new Date(),
          documentsStatus: i < 7 ? DocumentStatus.COMPLETE : DocumentStatus.PENDING,
          enrolledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          confirmedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      })
    );
  }

  // 15 matrículas para turma concluída (NR-35 Janeiro)
  for (let i = 10; i < 25; i++) {
    enrollments.push(
      prisma.enrollment.create({
        data: {
          studentId: students[i].id,
          classId: classes[5].id, // NR-35 concluída
          status: EnrollmentStatus.PRESENT,
          enrollmentToken: generateToken(),
          tokenUsedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          documentsStatus: DocumentStatus.COMPLETE,
          enrolledAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          confirmedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          attendedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      })
    );
  }

  // 8 matrículas para próxima turma NR-35 (agendadas)
  for (let i = 0; i < 8; i++) {
    const hasDiscount = i % 3 === 0;
    enrollments.push(
      prisma.enrollment.create({
        data: {
          studentId: students[i].id,
          classId: classes[0].id, // NR-35 próxima semana
          status: i < 5 ? EnrollmentStatus.CONFIRMED : EnrollmentStatus.SCHEDULED,
          enrollmentToken: generateToken(),
          tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          documentsStatus: i < 4 ? DocumentStatus.COMPLETE : DocumentStatus.PENDING,
          discount: hasDiscount ? 50.00 : 0,
          discountApprovedBy: hasDiscount ? users[0].id : null,
          discountApprovedAt: hasDiscount ? new Date() : null,
        },
      })
    );
  }

  // 5 matrículas para Acesso por Corda
  for (let i = 20; i < 25; i++) {
    enrollments.push(
      prisma.enrollment.create({
        data: {
          studentId: students[i].id,
          classId: classes[2].id, // Acesso por Corda
          status: EnrollmentStatus.CONFIRMED,
          enrollmentToken: generateToken(),
          tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          documentsStatus: DocumentStatus.PENDING,
        },
      })
    );
  }

  const createdEnrollments = await Promise.all(enrollments);
  console.log(`   ✅ Created ${createdEnrollments.length} enrollments`);

  // ============================================
  // LANÇAMENTOS DE CUSTO (M08)
  // ============================================
  console.log('🧾 Creating cost entries...');
  const costEntries = await Promise.all([
    prisma.costEntry.create({
      data: {
        code: 'CE0001',
        auditableCostId: auditableCosts[0].id,
        costCriterionId: costCriteria[0].id,
        studentId: students[0].id,
        classId: classes[0].id,
        supplierId: suppliers[0].id,
        companyId: companies[0].id,
        value: 50,
        generatedAt: new Date(),
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        status: CostEntryStatus.PENDING,
        notes: 'Lançamento inicial seed - material didático',
        autoGenerated: true,
        triggerAction: 'NewEnrollment',
      },
    }),
    prisma.costEntry.create({
      data: {
        code: 'CE0002',
        auditableCostId: auditableCosts[2].id,
        costCriterionId: costCriteria[2].id,
        classId: classes[4].id,
        instructorId: instructors[4].id,
        value: 200,
        generatedAt: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: CostEntryStatus.PENDING,
        notes: 'Lançamento seed - custo de instrutor',
        autoGenerated: true,
        triggerAction: 'InstructorAssignedToExam',
      },
    }),
  ]);
  console.log(`   ✅ Created ${costEntries.length} cost entries`);

  // ============================================
  // CRM - PIPELINE, CONTATOS, ATIVIDADES E DEALS
  // ============================================
  console.log('📈 Creating CRM seed data...');
  const pipelineStages = await Promise.all([
    prisma.cRMPipelineStage.create({
      data: { name: 'Lead', order: 0, color: '#64748b', isDefault: true, isActive: true },
    }),
    prisma.cRMPipelineStage.create({
      data: { name: 'Qualificado', order: 1, color: '#3b82f6', isDefault: false, isActive: true },
    }),
    prisma.cRMPipelineStage.create({
      data: { name: 'Negociação', order: 2, color: '#f59e0b', isDefault: false, isActive: true },
    }),
    prisma.cRMPipelineStage.create({
      data: { name: 'Fechado', order: 3, color: '#10b981', isDefault: false, isActive: true },
    }),
  ]);

  const crmContacts = await Promise.all([
    prisma.cRMContact.create({
      data: {
        code: 'C0001',
        name: students[0].name,
        email: students[0].email,
        phone: students[0].phone,
        company: companies[0].tradeName || companies[0].name,
        cpfCnpj: students[0].cpf,
        source: CRMContactSource.COMPANY,
        status: CRMContactStatus.QUALIFIED,
        assignedToId: users[2].id,
        studentId: students[0].id,
        companyId: companies[0].id,
        tags: ['nr35', 'offshore'],
        notes: 'Contato vindo da carteira PJ.',
      },
    }),
    prisma.cRMContact.create({
      data: {
        code: 'C0002',
        name: 'Marcos Vinicius Andrade',
        email: 'marcos.andrade@example.com',
        phone: '(21) 99876-1234',
        company: companies[1].tradeName || companies[1].name,
        cpfCnpj: '123.456.789-10',
        source: CRMContactSource.WHATSAPP,
        status: CRMContactStatus.LEAD,
        assignedToId: users[3].id,
        companyId: companies[1].id,
        tags: ['lead', 'soldagem'],
        notes: 'Lead captado por campanha multicanal.',
      },
    }),
    prisma.cRMContact.create({
      data: {
        code: 'C0003',
        name: 'Ana Paula Menezes',
        email: 'ana.menezes@example.com',
        phone: '(11) 99111-2244',
        company: companies[2].tradeName || companies[2].name,
        cpfCnpj: '987.654.321-00',
        source: CRMContactSource.WEBSITE,
        status: CRMContactStatus.NEGOTIATION,
        assignedToId: users[2].id,
        companyId: companies[2].id,
        tags: ['pipeline', 'nr33'],
      },
    }),
  ]);

  const crmActivities = await Promise.all([
    prisma.cRMActivity.create({
      data: {
        contactId: crmContacts[0].id,
        type: CRMActivityType.EMAIL,
        title: 'Envio de proposta inicial',
        description: 'Proposta comercial enviada por e-mail com opções de turma.',
        createdById: users[2].id,
      },
    }),
    prisma.cRMActivity.create({
      data: {
        contactId: crmContacts[1].id,
        type: CRMActivityType.WHATSAPP,
        title: 'Contato inicial',
        description: 'Primeiro contato registrado no CRM.',
        createdById: users[3].id,
      },
    }),
    prisma.cRMActivity.create({
      data: {
        contactId: crmContacts[2].id,
        type: CRMActivityType.FOLLOW_UP,
        title: 'Follow-up da negociação',
        description: 'Aguardando validação de orçamento pela empresa.',
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        createdById: users[2].id,
      },
    }),
  ]);

  const crmDeals = await Promise.all([
    prisma.cRMDeal.create({
      data: {
        code: 'D0001',
        contactId: crmContacts[0].id,
        stageId: pipelineStages[2].id,
        title: 'Fechamento turma NR-35 Petrobras',
        value: 12000,
        expectedCloseDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        status: CRMDealStatus.OPEN,
        courseId: courses[0].id,
        classId: classes[6].id,
      },
    }),
    prisma.cRMDeal.create({
      data: {
        code: 'D0002',
        contactId: crmContacts[2].id,
        stageId: pipelineStages[3].id,
        title: 'Turma NR-33 corporativa',
        value: 9500,
        expectedCloseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: CRMDealStatus.WON,
        wonAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        courseId: courses[4].id,
      },
    }),
  ]);
  console.log(`   ✅ Created ${pipelineStages.length} pipeline stages`);
  console.log(`   ✅ Created ${crmContacts.length} CRM contacts`);
  console.log(`   ✅ Created ${crmActivities.length} CRM activities`);
  console.log(`   ✅ Created ${crmDeals.length} CRM deals`);

  // ============================================
  // DOCUMENTOS DOS ALUNOS
  // ============================================
  console.log('📄 Creating student documents...');
  const documents = [];
  const docTypes = ['RG', 'CPF', 'ASO', 'Foto 3x4', 'Comprovante de Residência'];

  for (let i = 0; i < 20; i++) {
    const numDocs = 2 + Math.floor(Math.random() * 4); // 2 a 5 documentos
    for (let j = 0; j < numDocs; j++) {
      const isValidated = Math.random() > 0.3;
      documents.push(
        prisma.studentDocument.create({
          data: {
            studentId: students[i].id,
            documentType: docTypes[j % docTypes.length],
            // Placeholder de dev — sem serviço de storage real (SaaS fase futura)
            fileUrl: `data:application/pdf;base64,UE1PRE8tU0VBRA==`,
            fileName: `${docTypes[j % docTypes.length]}_${students[i].code}.pdf`,
            fileSize: 50000 + Math.floor(Math.random() * 500000),
            mimeType: 'application/pdf',
            status: isValidated ? DocumentStatus.COMPLETE : DocumentStatus.PENDING,
            validatedBy: isValidated ? users[2].id : null,
            validatedAt: isValidated ? new Date() : null,
          },
        })
      );
    }
  }

  await Promise.all(documents);
  console.log(`   ✅ Created ${documents.length} student documents`);

  // ============================================
  // PROVAS
  // ============================================
  console.log('📋 Creating exams...');
  const exams = [];
  let examIndex = 1;

  // Provas para turma concluída (todas aprovadas)
  const completedEnrollments = createdEnrollments.slice(10, 25);
  for (const enrollment of completedEnrollments) {
    exams.push(
      prisma.exam.create({
        data: {
          examCode: generateExamCode(examIndex++),
          enrollmentId: enrollment.id,
          courseId: courses[0].id,
          instructorId: instructors[0].id,
          examNumber: `P${String(examIndex).padStart(3, '0')}`,
          examType: 'Teórica',
          scheduledDate: lastWeek,
          scheduledTime: '14:00',
          duration: 60,
          status: ExamStatus.APPROVED,
          score: 70 + Math.floor(Math.random() * 30),
          passed: true,
        },
      })
    );
  }

  // Provas agendadas para turma em andamento
  const inProgressEnrollments = createdEnrollments.slice(0, 10);
  for (const enrollment of inProgressEnrollments.slice(0, 8)) {
    exams.push(
      prisma.exam.create({
        data: {
          examCode: generateExamCode(examIndex++),
          enrollmentId: enrollment.id,
          courseId: courses[4].id,
          instructorId: instructors[4].id,
          examNumber: `P${String(examIndex).padStart(3, '0')}`,
          examType: 'Teórica',
          scheduledDate: today,
          scheduledTime: '15:00',
          duration: 45,
          status: ExamStatus.SCHEDULED,
        },
      })
    );
  }

  await Promise.all(exams);
  console.log(`   ✅ Created ${exams.length} exams`);

  // ============================================
  // PAGAMENTOS
  // ============================================
  console.log('💳 Creating payments...');
  const payments = [];

  // Pagamentos das matrículas concluídas (todos pagos)
  for (const enrollment of completedEnrollments) {
    payments.push(
      prisma.payment.create({
        data: {
          enrollmentId: enrollment.id,
          companyId: companies[0].id,
          description: `Matrícula - ${courses[0].name}`,
          type: PaymentType.INCOME,
          category: PaymentCategory.COURSE_FEE,
          amount: 350.00,
          dueDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          paidAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
          status: PaymentStatus.PAID,
          paymentMethod: ['PIX', 'Cartão de Crédito', 'Boleto'][Math.floor(Math.random() * 3)],
          invoiceNumber: `NF-2026-${String(payments.length + 1).padStart(6, '0')}`,
        },
      })
    );
  }

  // Pagamentos pendentes para turma atual
  for (const enrollment of inProgressEnrollments.slice(0, 5)) {
    payments.push(
      prisma.payment.create({
        data: {
          enrollmentId: enrollment.id,
          companyId: companies[0].id,
          description: `Matrícula - ${courses[4].name}`,
          type: PaymentType.INCOME,
          category: PaymentCategory.COURSE_FEE,
          amount: 550.00,
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          status: PaymentStatus.PENDING,
        },
      })
    );
  }

  // Despesas operacionais
  payments.push(
    prisma.payment.create({
      data: {
        companyId: null,
        description: 'Aluguel - Fevereiro 2026',
        type: PaymentType.EXPENSE,
        category: PaymentCategory.RENT,
        amount: 15000.00,
        dueDate: new Date(2026, 1, 10),
        status: PaymentStatus.PENDING,
      },
    }),
    prisma.payment.create({
      data: {
        companyId: null,
        description: 'Energia Elétrica - Janeiro 2026',
        type: PaymentType.EXPENSE,
        category: PaymentCategory.UTILITIES,
        amount: 3500.00,
        dueDate: new Date(2026, 1, 5),
        paidAt: new Date(2026, 1, 3),
        status: PaymentStatus.PAID,
        paymentMethod: 'Débito Automático',
      },
    }),
    prisma.payment.create({
      data: {
        companyId: null,
        description: 'Manutenção Equipamentos',
        type: PaymentType.EXPENSE,
        category: PaymentCategory.MAINTENANCE,
        amount: 2500.00,
        dueDate: new Date(2026, 1, 20),
        status: PaymentStatus.PENDING,
      },
    })
  );

  await Promise.all(payments);
  console.log(`   ✅ Created ${payments.length} payments`);

  // ============================================
  // PRODUTOS EXTRAS POR MATRÍCULA
  // ============================================
  console.log('🎁 Creating enrollment extra products...');
  const enrollmentProducts = [];

  // Algumas matrículas com produtos extras
  for (let i = 0; i < 10; i++) {
    const enrollment = createdEnrollments[i];
    const numProducts = 1 + Math.floor(Math.random() * 3);
    
    for (let j = 0; j < numProducts; j++) {
      const product = products[j % products.length];
      const quantity = 1 + Math.floor(Math.random() * 2);
      
      enrollmentProducts.push(
        prisma.enrollmentExtraProduct.create({
          data: {
            enrollmentId: enrollment.id,
            extraProductId: product.id,
            quantity,
            unitPrice: product.price,
            totalPrice: product.price.toNumber() * quantity,
          },
        })
      );
    }
  }

  await Promise.all(enrollmentProducts);
  console.log(`   ✅ Created ${enrollmentProducts.length} enrollment extra products`);

  // ============================================
  // RESUMO FINAL
  // ============================================
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('📋 SUMMARY:');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`   👤 Users:                  ${users.length}`);
  console.log(`   🏢 Companies:              ${companies.length}`);
  console.log(`   ⚙️  Company Settings:       ${companySettings.length}`);
  console.log(`   🚪 Rooms:                  ${rooms.length}`);
  console.log(`   👨‍🏫 Instructors:            ${instructors.length}`);
  console.log(`   📚 Courses:                ${courses.length}`);
  console.log(`   💰 Costs:                  ${costs.length}`);
  console.log(`   📐 Cost Criteria:          ${costCriteria.length}`);
  console.log(`   🔗 Course-Cost Links:      ${courseCosts.length}`);
  console.log(`   🛒 Extra Products:         ${products.length}`);
  console.log(`   🏭 Suppliers:              ${suppliers.length}`);
  console.log(`   🎓 Students:               ${students.length}`);
  console.log(`   📅 Classes:                ${classes.length}`);
  console.log(`   📝 Enrollments:            ${createdEnrollments.length}`);
  console.log(`   🧾 Cost Entries:           ${costEntries.length}`);
  console.log(`   📄 Student Documents:      ${documents.length}`);
  console.log(`   📋 Exams:                  ${exams.length}`);
  console.log(`   💳 Payments:               ${payments.length}`);
  console.log(`   🎁 Enrollment Products:    ${enrollmentProducts.length}`);
  console.log(`   📈 CRM Stages:             ${pipelineStages.length}`);
  console.log(`   👥 CRM Contacts:           ${crmContacts.length}`);
  console.log(`   🗒️  CRM Activities:         ${crmActivities.length}`);
  console.log(`   💼 CRM Deals:              ${crmDeals.length}`);
  console.log('───────────────────────────────────────────────────────────────');
  console.log('');
  console.log('🔐 LOGIN CREDENTIALS:');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`   MASTER:       ${masterEmail}     / ${masterPassword}`);
  console.log(`   ADMIN:        ${adminEmail}      / ${adminPassword}`);
  console.log('   COLLABORATOR: colaborador@smcorp.com.br / Colab@123');
  console.log('   CLIENT PF:    cliente.pf@example.com   / Cliente@123');
  console.log('   CLIENT PJ:    cliente.pj@example.com   / Cliente@123');
  console.log('───────────────────────────────────────────────────────────────');
  console.log('');
  console.log('📊 CLASS STATUS DISTRIBUTION:');
  console.log('───────────────────────────────────────────────────────────────');
  console.log('   ⏰ SCHEDULED:    4 classes (próximas semanas)');
  console.log('   ▶️  IN_PROGRESS: 1 class (NR-33 hoje)');
  console.log('   ✅ COMPLETED:   1 class (NR-35 semana passada)');
  console.log('   🏢 COMPANY:     1 class (Petrobras fechada)');
  console.log('───────────────────────────────────────────────────────────────');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
