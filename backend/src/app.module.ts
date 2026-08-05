import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CompanySettingsModule } from './modules/company-settings/company-settings.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { InstructorsModule } from './modules/instructors/instructors.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { CostsModule } from './modules/costs/costs.module';
import { ExtraProductsModule } from './modules/extra-products/extra-products.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { StudentDocumentsModule } from './modules/student-documents/student-documents.module';
import { ExamsModule } from './modules/exams/exams.module';
import { ClassesModule } from './modules/classes/classes.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { StudentsModule } from './modules/students/students.module';
import { CoursesModule } from './modules/courses/courses.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { CrmModule } from './modules/crm/crm.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { MercadoPagoModule } from './modules/mercadopago/mercadopago.module';
import { BillingModule } from './modules/billing/billing.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { AuditService } from './common/services/audit.service';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { TenantContextModule } from './common/services/tenant-context.module';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Jobs agendados (billing, expiração de trial, overdue)
    ScheduleModule.forRoot(),

    // Contexto de tenant (global — compartilhado entre interceptor e Prisma)
    TenantContextModule,

    // Database
    PrismaModule,

    // Feature modules
    HealthModule,
    AuthModule,
    UsersModule,
    DashboardModule,
    CompanySettingsModule,
    SuppliersModule,
    InstructorsModule,
    RoomsModule,
    CompaniesModule,
    CostsModule,
    ExtraProductsModule,
    EnrollmentsModule,
    StudentDocumentsModule,
    ExamsModule,
    ClassesModule,
    PaymentsModule,
    StudentsModule,
    CoursesModule,
    CertificatesModule,
    CrmModule,
    TenantsModule,
    MercadoPagoModule,
    BillingModule,
    CommunicationModule,
  ],
  providers: [
    AuditService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
