import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { runAutoAvaliation } from '../etl/importAutoAvaliation';
import { runAv360eRef } from '../etl/importAv360eRef';

@ApiTags('ETL')
@Controller('etl')
export class EtlController {
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

  @Post('upload')
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
      try {
        const filePath = file.path;

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
      }
    }

    return {
      message: 'ETL finalizado',
      resultados,
    };
  }
}
