import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { databaseConfiguration } from '../db/datasource';
import { join } from 'path';
import { AnnouncementsModule } from './api/announcements/announcements.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

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
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: true,
      autoSchemaFile: true
    }),
    AnnouncementsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
