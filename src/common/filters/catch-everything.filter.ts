import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ResponseInterface } from '../interfaces/response.interface';
import { PinoLogger } from 'nestjs-pino';

interface ErrorResponse extends ResponseInterface<any> {
  statusCode: HttpStatus;
}

@Catch()
export class CatchEverythingFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost, private readonly logger: PinoLogger) {}

  catch(exception: HttpException, host: ArgumentsHost): void {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // const requestMethod = ctx.getRequest()['method'] as string;

    if (exception.name === 'PrismaClientKnownRequestError') {
      if (exception.message.includes('No record was found for an update'))
        throw new NotFoundException('No record found for update.');
      else if (exception.message.includes('No record was found for a delete'))
        throw new NotFoundException('No record found for deletion.');
      // else throw new NotFoundException('No record found.');
      // if ((requestMethod === 'PATCH' || requestMethod === 'PUT') || exception.message.includes('No record was found for an update'))
      //   throw new NotFoundException(exception.message);
      // else if (requestMethod)
    }

    if (httpStatus >= 500) this.logger.error(exception);
    const responseBody: ErrorResponse = {
      statusCode: httpStatus,
      success: false,
      data: null,
      message:
        httpStatus >= 500
          ? 'Internal Server Error'
          : (exception.getResponse()['message'] as string) || 'Error',
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, responseBody.statusCode);
  }
}
