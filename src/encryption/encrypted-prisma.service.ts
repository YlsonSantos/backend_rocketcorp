import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { encryptedFieldsMap } from './encrypted-fields.config';
type ModelNames = keyof typeof encryptedFieldsMap;

@Injectable()
export class EncryptedPrismaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  private encrypt(model: string, data: any): any {
    const fields = (encryptedFieldsMap as Record<string, readonly string[]>)[
      model
    ];
    if (!fields) return data;

    const copy = { ...data };
    for (const field of fields) {
      if (copy[field] && typeof copy[field] === 'string') {
        copy[field] = this.crypto.encrypt(copy[field]);
      }
    }
    return copy;
  }

  private decrypt(model: string, data: any): any {
    const fields = (encryptedFieldsMap as Record<string, readonly string[]>)[
      model
    ];
    if (!fields) return data;

    const copy = { ...data };
    for (const field of fields) {
      if (copy[field] && typeof copy[field] === 'string') {
        copy[field] = this.crypto.decrypt(copy[field]);
      }
    }
    return copy;
  }

  async create(model: ModelNames, data: any): Promise<any> {
    const encrypted = this.encrypt(model, data);
    const result = await (this.prisma[model] as any).create({
      data: encrypted,
    });
    return this.decrypt(model, result);
  }

  async findUnique(model: ModelNames, args: any): Promise<any> {
    const modelDelegate = this.prisma[model] as any;
    const result = await modelDelegate.findUnique({ args });
    return result ? this.decrypt(model, result) : null;
  }

  async findMany(model: ModelNames, args: any = {}): Promise<any[]> {
    const modelDelegate = this.prisma[model] as any;
    const results = await modelDelegate.findMany(args);
    return results.map((r: any) => this.decrypt(model, r));
  }

  async update(
    model: ModelNames,
    args: { where: any; data: any; include?: any; select?: any },
  ): Promise<any> {
    const modelDelegate = this.prisma[model] as any;
    const encrypted = this.encrypt(model, args.data);
    const result = await modelDelegate.update({
      where: args.where,
      data: encrypted,
    });
    return this.decrypt(model, result);
  }

  async createMany(model: ModelNames, data: any[]): Promise<any> {
    const encryptedData = data.map((item) => this.encrypt(model, item));
    const modelDelegate = this.prisma[model] as any;
    const result = await modelDelegate.createMany({
      data: encryptedData,
    });
    // createMany não retorna os registros criados, só um objeto com contagem, então não dá pra descriptografar os dados aqui
    return result;
  }
}
