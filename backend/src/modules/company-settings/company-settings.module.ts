import { Module } from '@nestjs/common';
import { CompanySettingsController } from './company-settings.controller';
import { CompanySettingsService } from './company-settings.service';
import { EncryptionService } from '@/common/services/encryption.service';

@Module({
  controllers: [CompanySettingsController],
  providers: [CompanySettingsService, EncryptionService],
  exports: [CompanySettingsService],
})
export class CompanySettingsModule {}
