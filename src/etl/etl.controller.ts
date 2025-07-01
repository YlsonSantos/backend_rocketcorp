import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { runAutoAvaliation } from '../etl/importAutoAvaliation';
import { runAv360eRef } from '../etl/importAv360eRef';
import { Roles } from 'src/auth/roles.decorator';
import * as fsSync from 'fs';
import { promises as fs } from 'fs';
import * as path from 'path';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiTags('ETL')
@Controller('etl')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EtlController {
  constructor() {
    const uploadDir = path.join(__dirname, '..', 'etl', 'uploads');
    if (!fsSync.existsSync(uploadDir)) {
      fsSync.mkdirSync(uploadDir, { recursive: true });
      console.log('📂 Pasta de upload criada:', uploadDir);
    }
  }
  // Função para customizar o nome dos arquivos
  private static editFileName(
    _req: any,
    file: Express.Multer.File,
    callback: (error: Error | null, filename: string) => void,
  ) {
    const name = file.originalname.split('.')[0];
    const fileExtName = extname(file.originalname);
    const uniqueSuffix = Date.now();
    callback(null, `${name}-${uniqueSuffix}${fileExtName}`);
  }

  //como apenas existirá esse endpoint, não há necessidade de criar um service para o ETL
  @Post('upload')
  @Roles('RH')
  @ApiOperation({ summary: 'Upload de arquivos .xlsx para ETL' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './src/etl/uploads',
        filename: EtlController.editFileName,
      }),
      fileFilter: (_, file, callback) => {
        if (!file.originalname.match(/\.(xlsx)$/i)) {
          return callback(
            new HttpException(
              'Somente arquivos .xlsx são permitidos!',
              HttpStatus.BAD_REQUEST,
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadMultiple(@UploadedFiles() files: Array<Express.Multer.File>) {
    if (!files || files.length === 0) {
      throw new HttpException(
        'Nenhum arquivo enviado.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const resultados = [];

    for (const file of files) {
      const filePath = file.path;

      try {
        await runAutoAvaliation(filePath);
        await runAv360eRef(filePath);

        resultados.push({
          file: file.originalname,
          status: 'sucesso',
        });
      } catch (error) {
        console.error(`❌ Erro ao processar ${file.originalname}:`, error);
        resultados.push({
          file: file.originalname,
          status: 'erro',
          error: error.message,
        });
      } finally {
        try {
          await fs.unlink(filePath);
          console.log(`🗑️ Arquivo deletado: ${file.originalname}`);
        } catch (unlinkError) {
          console.error(
            `❌ Falha ao deletar ${file.originalname}:`,
            unlinkError,
          );
        }
      }
    }

    return {
      message: 'ETL finalizado',
      resultados,
    };
  }
}
