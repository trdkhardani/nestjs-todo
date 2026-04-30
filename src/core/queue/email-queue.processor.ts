import { MailerService } from '@nestjs-modules/mailer';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { ExtendedJob } from './interfaces/job.interface';
import { JobEmailData } from './interfaces/email-queue.interface';

@Processor('email-queue', {
  removeOnComplete: {
    count: 1,
  },
  removeOnFail: {
    count: 5,
  },
})
export class EmailQueueProcessor extends WorkerHost {
  constructor(
    private mailerService: MailerService,
  ) {
    super();
  }

  async process(job: ExtendedJob<JobEmailData>) {
    try {
      console.log(`Sending email to ${job.data.email}`);
      await this.mailerService.sendMail({
        to: job.data.email,
        subject: job.data.mailerInput.subject,
        template: job.data.mailerInput.template,
        context: {
          name: job.data.name,
          otpCode: job.data.otpCode,
        },
      });
      console.log(`Email sent to ${job.data.email}`);
    } catch (err) {
      console.log(`Error sending email: ${err}`);
      throw err;
    }
  }
}
