import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { isTrustProxyEnabled } from './common/client-ip';
import { assertBootEnv } from './config';

async function bootstrap() {
  assertBootEnv();

  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.setGlobalPrefix('api/v1');
  if (isTrustProxyEnabled()) {
    const http = app.getHttpAdapter().getInstance() as {
      set?: (key: string, value: unknown) => void;
    };
    http.set?.('trust proxy', 1);
  }
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
