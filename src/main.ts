import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AuditInterceptor } from './audit/audit.interceptor';
import { CorrelationIdMiddleware } from './audit/middleware/correlation-id.middleware';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet());

  // Enable CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400, // 24 horas
  });

  // Apply correlation ID middleware globally
  app.use(new CorrelationIdMiddleware().use);

  // Apply global audit interceptor
  app.useGlobalInterceptors(app.get(AuditInterceptor));

  // Enable global validation pipes with enhanced security
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true, // Rejeita campos não esperados
      forbidUnknownValues: true,   // Rejeita valores desconhecidos
      skipMissingProperties: false,
      skipNullProperties: false,
      skipUndefinedProperties: false,
      validationError: {
        target: false, // Não expõe o objeto original no erro
        value: false,  // Não expõe o valor no erro
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('RocketCorp API')
    .setDescription(
      'All the routes and endpoints for RocketCorp.\n\n**Authentication:**\n1. Use the `/auth/login` endpoint to get your JWT token.\n2. Click the "Authorize" button in the Swagger UI and enter your token as:\n\n    Bearer <your_token_here>\n\n(Include the word `Bearer` and a space before your token.)',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
}
bootstrap();
