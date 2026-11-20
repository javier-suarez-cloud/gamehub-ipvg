import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

  // Swagger: documentación y pruebas de la API en http://localhost:3000/api
  const config = new DocumentBuilder()
    .setTitle('GameHub IPVG API')
    .setDescription('API REST de torneos internos de videojuegos y eSports del IPVG')
    .setVersion('1.0')
    .addBearerAuth() // agrega el botón "Authorize" para pegar el token JWT
    .build();
  const documento = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documento);

  // Levanta el servidor en el puerto del .env o en el 3000
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
