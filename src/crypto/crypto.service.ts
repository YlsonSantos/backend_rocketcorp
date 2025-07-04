import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { encryptedFieldsMap } from '../encryption/encrypted-fields.config';

type ModelName = keyof typeof encryptedFieldsMap;

@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key = crypto.scryptSync(
    process.env.CRYPTO_SECRET_KEY ??
      (() => {
        throw new Error('CRYPTO_SECRET_KEY não definido');
      })(),
    'salt',
    32,
  );
  private readonly iv = Buffer.alloc(16, 0); // IV fixo (determinístico)

  encrypt(text: string): string {
    if (!text) return text;
    const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  decrypt(text: string): string {
    if (!text) return text;
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  deepDecrypt(obj: any, modelName: ModelName): any {
    if (!obj || typeof obj !== 'object') return obj;

    const fieldsToDecrypt = encryptedFieldsMap[modelName] || [];

    for (const key of Object.keys(obj)) {
      const val = obj[key];

      if (fieldsToDecrypt.includes(key) && val) {
        try {
          obj[key] = this.decrypt(val);
        } catch {
          // evita crash se já estiver descriptografado ou malformado
        }
      } else if (Array.isArray(val)) {
        if (key === 'answers') {
          obj[key] = val.map((item) =>
            this.deepDecrypt(item, 'EvaluationAnswer'),
          );
        } else {
          obj[key] = val.map((item) => this.deepDecrypt(item, modelName));
        }
      } else if (typeof val === 'object' && val !== null) {
        obj[key] = this.deepDecrypt(val, modelName);
      }
    }

    return obj;
  }
}
