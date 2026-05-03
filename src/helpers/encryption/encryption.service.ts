import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

@Injectable()
export class EncryptionService {
  constructor(private configService: ConfigService) {}

  encrypt(plaintext: string) {
    const iv = randomBytes(12);
    const encryptionKey = Buffer.from(this.configService.get('appEncryptionKey'), 'base64');
    const cipher = createCipheriv('aes-256-gcm', encryptionKey, iv);

    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf-8'),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    return {
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      encryptedData: ciphertext.toString('base64'),
    };
  }

  decrypt(fromEncryption: { iv: Base64URLString, tag: Base64URLString, encryptedData: Base64URLString }) {
    const encryptionKey = Buffer.from(this.configService.get('appEncryptionKey'), 'base64');

    const decipher = createDecipheriv(
      'aes-256-gcm',
      encryptionKey,
      Buffer.from(fromEncryption.iv, 'base64'),
    );

    decipher.setAuthTag(Buffer.from(fromEncryption.tag, 'base64'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(fromEncryption.encryptedData, 'base64')),
      decipher.final(),
    ]);

    return decrypted.toString('utf-8');
  }
}
