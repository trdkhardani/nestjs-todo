import { ConfigService } from '@nestjs/config';
import * as mongoose from 'mongoose';

export const mongoProvider = [
  {
    inject: [ConfigService],
    provide: 'MONGODB_CONNECTION',
    useFactory: (configService: ConfigService): Promise<typeof mongoose> =>
      mongoose.connect(configService.get<string>('mongoDbUrl') as string),
  },
];
