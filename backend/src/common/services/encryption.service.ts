import { Injectable, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { ConfigService } from '@nestjs/config';

/**
 * Serviço de criptografia para dados sensíveis
 * Usa AES-256-GCM para criptografia autenticada
 */
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly saltLength = 64;
  private readonly tagLength = 16; // 128 bits
  private readonly key: Buffer;
  private readonly logger = new Logger(EncryptionService.name);

  constructor(private configService: ConfigService) {
    const secret = this.configService.get<string>('ENCRYPTION_KEY');
    const salt = this.configService.get<string>('ENCRYPTION_SALT');
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    if (!secret || !salt) {
      if (isProduction) {
        // Fail-fast: em produção, dados sensíveis (SMTP/WhatsApp/bancário)
        // NUNCA podem ser criptografados com chave padrão.
        throw new Error(
          'ENCRYPTION_KEY e ENCRYPTION_SALT são obrigatórios em produção. ' +
            "Gere com: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
        );
      }
      this.logger.warn(
        'ENCRYPTION_KEY/ENCRYPTION_SALT ausentes: usando chave padrão APENAS para desenvolvimento.',
      );
    }

    const effectiveSecret = secret || 'default-secret-key-change-me';
    const effectiveSalt = salt || 'default-salt-change-me';

    // Usa scrypt para derivar uma chave forte
    this.key = scryptSync(effectiveSecret, effectiveSalt, this.keyLength);
  }

  /**
   * Criptografa um objeto JSON e retorna uma string base64
   * @param data Objeto a ser criptografado
   * @returns String criptografada em base64
   */
  encrypt(data: unknown): string {
    try {
      const jsonString = JSON.stringify(data);
      const iv = randomBytes(this.ivLength);
      const cipher = createCipheriv(this.algorithm, this.key, iv);

      let encrypted = cipher.update(jsonString, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      // Pega a authentication tag
      const authTag = cipher.getAuthTag();

      // Retorna: iv + authTag + encrypted (tudo em base64)
      const result = {
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        data: encrypted,
      };

      return Buffer.from(JSON.stringify(result)).toString('base64');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Encryption failed: ${message}`);
    }
  }

  /**
   * Descriptografa uma string base64 e retorna o objeto JSON original
   * @param encryptedData String criptografada em base64
   * @returns Objeto descriptografado
   */
  decrypt<T = unknown>(encryptedData: string): T {
    try {
      const jsonString = Buffer.from(encryptedData, 'base64').toString('utf8');
      const { iv, authTag, data } = JSON.parse(jsonString);

      const ivBuffer = Buffer.from(iv, 'base64');
      const authTagBuffer = Buffer.from(authTag, 'base64');

      const decipher = createDecipheriv(this.algorithm, this.key, ivBuffer);
      decipher.setAuthTag(authTagBuffer);

      let decrypted = decipher.update(data, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted) as T;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Decryption failed: ${message}`);
    }
  }

  /**
   * Criptografa apenas campos sensíveis de um objeto
   * @param data Objeto com campos sensíveis
   * @param sensitiveFields Array de campos a serem criptografados
   * @returns Objeto com campos sensíveis criptografados
   */
  encryptFields<T extends Record<string, unknown>>(data: T, sensitiveFields: string[]): T {
    const result: Record<string, unknown> = { ...data };

    for (const field of sensitiveFields) {
      if (result[field] !== undefined && result[field] !== null) {
        result[field] = this.encrypt(result[field]);
      }
    }

    return result as T;
  }

  /**
   * Descriptografa apenas campos sensíveis de um objeto
   * @param data Objeto com campos sensíveis criptografados
   * @param sensitiveFields Array de campos a serem descriptografados
   * @returns Objeto com campos sensíveis descriptografados
   */
  decryptFields<T extends Record<string, unknown>>(data: T, sensitiveFields: string[]): T {
    const result: Record<string, unknown> = { ...data };

    for (const field of sensitiveFields) {
      if (
        result[field] !== undefined &&
        result[field] !== null &&
        typeof result[field] === 'string'
      ) {
        try {
          result[field] = this.decrypt(result[field]);
        } catch (error) {
          // Se falhar ao descriptografar, pode ser porque o campo não está criptografado (migração)
          const message = error instanceof Error ? error.message : String(error);
          console.warn(`Failed to decrypt field ${field}:`, message);
        }
      }
    }

    return result as T;
  }
}
