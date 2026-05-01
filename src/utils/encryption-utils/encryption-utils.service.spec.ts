import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionUtilsService } from './encryption-utils.service';

describe('EncryptionUtilsService', () => {
  let service: EncryptionUtilsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EncryptionUtilsService],
    }).compile();

    service = module.get<EncryptionUtilsService>(EncryptionUtilsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
