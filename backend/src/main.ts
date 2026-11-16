import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Punto de entrada: aquí arranca la API
async function bootstrap() {
  // Crea la aplicación Nest a partir del módulo raíz
  const app = await NestFactory.create(AppModule);

  // Valida todos los datos que llegan según los DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina campos que no están en el DTO
      forbidNonWhitelisted: true, // y si llegan campos extra, responde error 400
      transform: true, // convierte los datos al tipo del DTO (ej: "5" -> 5)
    }),
  );

  // Permite que el frontend Vue (puerto 5173) consuma esta API
  app.enableCors({ origin: 'http://localhost:5173' });

  // Levanta el servidor en el puerto del .env o en el 3000
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();