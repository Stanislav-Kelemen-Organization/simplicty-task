import {
    ArgumentsHost,
    Catch,
    HttpException,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { GqlArgumentsHost, GqlExceptionFilter } from '@nestjs/graphql';
import { EntityNotFoundError } from 'typeorm';

@Catch()
export class AllExceptionFilter implements GqlExceptionFilter {
    private logger = new Logger();

    catch(exception: HttpException | Error, host: ArgumentsHost) {
        const gqlHost = GqlArgumentsHost.create(host);

        const { key: operation, typename: operationType } = gqlHost.getInfo<{
            path: { key: string; typename: string };
        }>().path;

        this.logger.error(exception);

        if (exception.constructor === EntityNotFoundError) {
            return new NotFoundException(`${operation} not found`);
        }

        if (exception instanceof HttpException) {
            return exception;
        }

        return new InternalServerErrorException(
            `${operationType} ${operation} failed`,
        );
    }
}
