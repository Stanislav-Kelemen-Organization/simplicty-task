import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { databaseConfiguration } from '../db/datasource';
import { join } from 'path';
import { AnnouncementsModule } from './api/announcements/announcements.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { CategoriesModule } from './api/categories/categories.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRoot({
            ...databaseConfiguration,
            autoLoadEntities: true,
            entities: [join(__dirname, './**/*.model.ts')],
        }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            introspection: true,
            autoSchemaFile: 'schema.graphql',
        }),
        AnnouncementsModule,
        CategoriesModule,
    ],
})
export class AppModule {}
