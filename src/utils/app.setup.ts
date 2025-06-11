import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AllExceptionFilter } from '../common/exception-filters';

export function appSetup(app: INestApplication) {
    app.enableCors({
        origin: 'https://studio.apollographql.com',
        methods: '*',
    }); // just to enable Apollo Sandbox

    app.useGlobalFilters(new AllExceptionFilter());
    app.useGlobalPipes(new ValidationPipe());
}
