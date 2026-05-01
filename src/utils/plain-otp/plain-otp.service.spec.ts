import { Test, TestingModule } from '@nestjs/testing';
import { PlainOtpService } from './plain-otp.service';

describe('PlainOtpService', () => {
  let service: PlainOtpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlainOtpService],
    }).compile();

    service = module.get<PlainOtpService>(PlainOtpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
