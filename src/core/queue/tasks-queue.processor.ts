import { Processor, WorkerHost } from '@nestjs/bullmq';
import { PrismaService } from '../database/prisma.service';
import { ExtendedJob, JobTasksData } from './interfaces/tasks-queue.interface';
import { Model } from 'mongoose';
import { JobDoc, JobStatus } from './interfaces/job.interface';
import { Inject } from '@nestjs/common';
import { NotificationService } from './queue-notification.service';
import { WsGateway } from 'src/websocket/ws.gateway';

@Processor('tasks-queue', {
  removeOnComplete: {
    count: 1,
  },
  removeOnFail: {
    count: 5,
  },
})
export class TasksQueueProcessor extends WorkerHost {
  constructor(
    private prisma: PrismaService,
    private readonly wsGateway: WsGateway,
    @Inject('JOB_MODEL')
    private jobModel: Model<JobDoc>,
  ) {
    super();
  }

  async process(job: ExtendedJob<JobTasksData>) {
    const eventName = 'BulkTaskCreation';
    try {
      console.log(`Processing Job... \n ID: ${job.id} \n Name: ${job.name}`);
      // await this.notificationService.sendNotification({
      //   data: 'processing...',
      // });
      this.wsGateway.notifyUser(job.data.userId, eventName, {
        message: `Creating tasks...`,
      });

      const createJobLog = new this.jobModel({
        jobId: job.id,
        userId: job.data.userId,
        jobName: job.name,
        queueName: job.queueName,
      });
      const saveJob = await createJobLog.save();
      console.log(saveJob);

      const tasksData = job.data.tasks.map((task) => {
        return {
          task_title: task.title,
          ...(task.description ? { task_description: task.description } : {}),
          user_id: job.data.userId,
          ...(task.categoryId ? { category_id: task.categoryId } : {}),
        };
      });

      console.log(tasksData);
      await this.prisma.task.createMany({
        data: tasksData,
      });

      // await this.notificationService.sendNotification({
      //   data: 'done',
      // });
      this.wsGateway.notifyUser(job.data.userId, eventName, {
        message: 'Tasks created successfully!',
      });

      const currentJob = await this.jobModel.findOne({
        jobId: job.id,
        userId: job.data.userId,
      });
      if (currentJob) {
        currentJob.finishedAt = new Date();
        currentJob.status = JobStatus.SUCCESSFUL;
        await currentJob.save();
      }
      console.log(`Job with ID ${job.id} successfully processed.`);
    } catch (err) {
      // await this.notificationService.sendNotification({
      //   data: 'failed',
      // });
      this.wsGateway.notifyUser(job.data.userId, eventName, {
        message: 'Tasks creation failed!',
      });
      console.error(`Job with ID ${job.id} failed: ${err}`);
      await this.jobModel.findOneAndUpdate(
        {
          jobId: job.id,
          userId: job.data.userId,
        },
        {
          status: JobStatus.FAILED,
          finishedAt: new Date(),
        },
      );
    }
  }
}
