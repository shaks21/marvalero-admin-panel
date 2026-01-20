import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { AuditInterceptor } from './audit/audit.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply audit interceptor globally
  const auditInterceptor = app.get(AuditInterceptor);
  app.useGlobalInterceptors(auditInterceptor);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
