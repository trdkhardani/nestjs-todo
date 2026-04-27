import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { ZodError, type ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (err: any) {
      if (err instanceof ZodError) {
        if (err.issues[0].code === 'too_big') {
          throw new PayloadTooLargeException(err.issues, {
            cause: err,
            description: 'Zod Validation Error: Payload Too Large',
          });
        }
        throw new BadRequestException(err.issues, {
          cause: err,
          description: 'Zod Validation Error',
        });
      }
    }
  }
}
