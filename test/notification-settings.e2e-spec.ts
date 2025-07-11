import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../prisma/prisma.service';

// Helper para criar um ciclo de avaliação
async function createCycle(prisma: PrismaService) {
  return prisma.evaluationCycle.create({
    data: {
      name: 'Ciclo Teste Notificação',
      startDate: new Date(),
      reviewDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
  });
}

describe('NotificationSettingsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cycle: any;
  let authHeader: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    prisma = app.get(PrismaService);
    cycle = await createCycle(prisma);

    // Login para obter token JWT
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'analaura@example.com', password: '123456' })
      .expect(201);
    const token = loginRes.body.access_token || loginRes.body.token;
    authHeader = { Authorization: `Bearer ${token}` };
  });

  afterAll(async () => {
    if (prisma && cycle) {
      await prisma.cycleNotificationSetting.deleteMany({ where: { cycleId: cycle.id } });
      await prisma.evaluationCycle.delete({ where: { id: cycle.id } });
    }
    await app.close();
  });

  it('deve criar uma configuração de notificação com campos parametrizáveis', async () => {
    const dto = {
      notificationType: 'EVALUATION_DUE',
      enabled: true,
      reminderDays: 5,
      customMessage: 'Mensagem customizada',
      scheduledTime: '09:30',
      frequency: 'DAILY',
      weekDay: null,
      userFilters: { roles: ['COLABORADOR'] },
      priority: 'HIGH',
    };
    const res = await request(app.getHttpServer())
      .post(`/notification-settings/cycles/${cycle.id}`)
      .set(authHeader)
      .send(dto)
      .expect(201);
    expect(res.body).toMatchObject({
      cycleId: cycle.id,
      notificationType: 'EVALUATION_DUE',
      enabled: true,
      reminderDays: 5,
      customMessage: 'Mensagem customizada',
      scheduledTime: '09:30',
      frequency: 'DAILY',
      priority: 'HIGH',
      userFilters: expect.any(Object),
    });
  });

  it('deve listar as configurações do ciclo', async () => {
    const res = await request(app.getHttpServer())
      .get(`/notification-settings/cycles/${cycle.id}`)
      .set(authHeader)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('notificationType');
  });

  it('deve atualizar a configuração de notificação', async () => {
    const updateDto = {
      enabled: false,
      reminderDays: 2,
      customMessage: 'Nova mensagem',
    };
    const res = await request(app.getHttpServer())
      .put(`/notification-settings/cycles/${cycle.id}/EVALUATION_DUE`)
      .set(authHeader)
      .send(updateDto)
      .expect(200);
    expect(res.body).toMatchObject({
      enabled: false,
      reminderDays: 2,
      customMessage: 'Nova mensagem',
    });
  });

  it('deve remover a configuração de notificação', async () => {
    await request(app.getHttpServer())
      .delete(`/notification-settings/cycles/${cycle.id}/EVALUATION_DUE`)
      .set(authHeader)
      .expect(200);
    const res = await request(app.getHttpServer())
      .get(`/notification-settings/cycles/${cycle.id}`)
      .set(authHeader)
      .expect(200);
    expect(res.body.length).toBe(0);
  });
}); 