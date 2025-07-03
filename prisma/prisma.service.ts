import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { CryptoService } from '../src/crypto/crypto.service'; // ajuste o caminho conforme seu projeto
import { encryptedFieldsMap } from '../src/encryption/encrypted-fields.config';

type ModelName = keyof typeof encryptedFieldsMap;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private crypto = new CryptoService();

  constructor() {
    super();

    this.$use(async (params: Prisma.MiddlewareParams, next) => {
      const modelName = params.model as ModelName;

      // 🔐 Função recursiva para encriptar dados antes de criar/atualizar
      const deepEncrypt = (obj: any, modelName: ModelName): any => {
        if (!obj || typeof obj !== 'object') return obj;
        const fields = encryptedFieldsMap[modelName] || [];

        for (const key of Object.keys(obj)) {
          const val = obj[key];
          if (fields.includes(key) && val != null) {
            obj[key] = this.crypto.encrypt(String(val));
          } else if (Array.isArray(val)) {
            obj[key] = val.map((item) => deepEncrypt(item, modelName));
          } else if (typeof val === 'object' && val !== null) {
            obj[key] = deepEncrypt(val, modelName);
          }
        }
        return obj;
      };

      // 🔐 Nova função para criptografar filtros em "where"
      const encryptWhere = (where: any, modelName: ModelName): any => {
        if (!where || typeof where !== 'object') return where;
        const fields = encryptedFieldsMap[modelName] || [];

        // Percorre as chaves do filtro "where"
        for (const key of Object.keys(where)) {
          const val = where[key];
          // Se o campo é criptografado e o valor é string, criptografa
          if (fields.includes(key) && typeof val === 'string') {
            where[key] = this.crypto.encrypt(val);
          } else if (typeof val === 'object' && val !== null) {
            // Recurssão para estruturas mais complexas, ex: { AND: [...], OR: [...] }
            where[key] = encryptWhere(val, modelName);
          }
        }
        return where;
      };

      // 🔓 Função recursiva para descriptografar dados após leitura
      const deepDecrypt = (obj: any, modelName: ModelName): any => {
        if (!obj || typeof obj !== 'object') return obj;
        const fields = encryptedFieldsMap[modelName] || [];

        for (const key of Object.keys(obj)) {
          const val = obj[key];
          if (fields.includes(key) && val != null) {
            try {
              obj[key] = this.crypto.decrypt(String(val));
            } catch {
              // Ignore caso já esteja descriptografado ou inválido
            }
          } else if (Array.isArray(val)) {
            obj[key] = val.map((item) => deepDecrypt(item, modelName));
          } else if (typeof val === 'object' && val !== null) {
            obj[key] = deepDecrypt(val, modelName);
          }
        }
        return obj;
      };

      // ✍️ Antes de gravar dados (create, update, upsert)
      if (
        ['create', 'update', 'upsert'].includes(params.action) &&
        params.args?.data &&
        modelName
      ) {
        params.args.data = deepEncrypt(params.args.data, modelName);
      }

      // ✍️ ** NOVO: Criptografar filtros de consulta (where) em findUnique, findFirst, findMany, update, delete
      if (
        params.args?.where &&
        modelName &&
        ['findUnique', 'findFirst', 'findMany', 'update', 'delete'].includes(
          params.action,
        )
      ) {
        params.args.where = encryptWhere(params.args.where, modelName);
      }

      // ▶️ Executa a operação
      const result = await next(params);

      // 📤 Após leitura de dados (findUnique, findFirst, findMany)
      if (
        ['findUnique', 'findFirst', 'findMany'].includes(params.action) &&
        result &&
        modelName
      ) {
        if (Array.isArray(result)) {
          return result.map((item) => deepDecrypt(item, modelName));
        } else {
          return deepDecrypt(result, modelName);
        }
      }

      return result;
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
