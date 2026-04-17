import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

interface ErrorResponse {
  statusCode: HttpStatus;
  success: false;
  data: null;
  message: unknown;
}

@Catch()
export class CatchEverythingFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

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
      else throw new NotFoundException('No record found.');
      // if ((requestMethod === 'PATCH' || requestMethod === 'PUT') || exception.message.includes('No record was found for an update'))
      //   throw new NotFoundException(exception.message);
      // else if (requestMethod)
    }

    if (httpStatus >= 500) console.error(exception.stack);
    const responseBody: ErrorResponse = {
      statusCode: httpStatus,
      success: false,
      data: null,
      message:
        httpStatus >= 500
          ? 'Internal Server Error'
          : exception.getResponse()['message'] || exception.getResponse(),
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, responseBody.statusCode);
  }
}
