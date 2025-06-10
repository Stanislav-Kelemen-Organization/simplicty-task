import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { databaseConfiguration } from '../db/datasource';
import { join } from 'path';

console.log(__dirname, '----__dirname----')

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      ...databaseConfiguration,
      autoLoadEntities: true,
      entities: [join(__dirname, './**/*.model.ts')]
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
