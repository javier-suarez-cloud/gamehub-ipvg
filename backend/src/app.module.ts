import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Módulo raíz: aquí se arma toda la aplicación
@Module({
  imports: [
    // Lee el archivo .env y deja sus variables disponibles en todo el proyecto
    ConfigModule.forRoot({ isGlobal: true }),

    // Conexión a MySQL con TypeORM, usando los datos del .env
    TypeOrmModule.forRootAsync({
      inject: [ConfigService], // pide el servicio que lee el .env
      useFactory: (config: ConfigService) => ({
        type: 'mysql', // motor de base de datos
        host: config.get('DB_HOST'), // servidor (localhost)
        port: Number(config.get('DB_PORT')), // puerto de MySQL (3306)
        username: config.get('DB_USER'), // usuario de MySQL
        password: config.get('DB_PASSWORD'), // contraseña (solo en .env)
        database: config.get('DB_NAME'), // base de datos gamehub_db
        autoLoadEntities: true, // carga solas las entidades de cada módulo
        synchronize: true, // crea/actualiza las tablas según las entidades (solo desarrollo)
      }),
    }),
  ],
})
export class AppModule {}