import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: 'https://studio.apollographql.com',
        methods: '*',
    }); // just to enable Apollo Sandbox

    await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
