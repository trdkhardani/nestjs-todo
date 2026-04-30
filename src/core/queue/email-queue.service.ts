import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { JobEmailData } from './interfaces/email-queue.interface';

@Injectable()
export class EmailQueueService {
  constructor(
    @InjectQueue('email-queue')
    private readonly emailQueue: Queue,
  ) {}

  async addJob(jobName: string, data: JobEmailData) {
    await this.emailQueue.add(jobName, data);
  }
}
