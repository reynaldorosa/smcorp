import { Module } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { CommunicationController } from './communication.controller';
import { UniqSuporteProvider } from './providers/uniq-suporte.provider';
import { SmtpEmailProvider } from './providers/smtp-email.provider';
import { PrismaModule } from '../../prisma/prisma.module';
import { EncryptionService } from '../../common/services/encryption.service';

@Module({
  imports: [PrismaModule],
  controllers: [CommunicationController],
  providers: [CommunicationService, UniqSuporteProvider, SmtpEmailProvider, EncryptionService],
  exports: [CommunicationService],
})
export class CommunicationModule {}
