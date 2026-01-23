import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { AuditInterceptor } from './audit/audit.interceptor.js';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  // Cast to NestExpressApplication to access Express-specific methods
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // TRUST PROXY: Essential for Throttler to see the real User IP
  // '1' means trust the first hop. Use 'true' if behind many hops (Cloudflare -> Nginx).
  app.set('trust proxy', 1);

  // 1. Get origin from environment (e.g., https://admin.marvalero.com)
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

  app.enableCors({
    origin: allowedOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    // 2. Preflight success status (some legacy browsers choke on 204)
    optionsSuccessStatus: 200,
  });

  app.setGlobalPrefix('api');

  // Interceptors should usually come AFTER CORS/Prefix setup
  const auditInterceptor = app.get(AuditInterceptor);
  app.useGlobalInterceptors(auditInterceptor);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
