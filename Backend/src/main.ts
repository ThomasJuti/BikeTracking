import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function resolveCorsOrigins(): string[] {
  const defaults = ['http://localhost:4200', 'http://127.0.0.1:4200'];
  const extra = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean) ?? [];
  return [...new Set([...defaults, ...extra])];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: resolveCorsOrigins(),
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
