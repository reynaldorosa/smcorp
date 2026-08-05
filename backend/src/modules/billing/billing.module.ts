import { Module } from '@nestjs/common';
import { BillingJobsService } from './billing-jobs.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PrismaModule, PaymentsModule],
  providers: [BillingJobsService],
})
export class BillingModule {}
