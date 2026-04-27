import { Processor, WorkerHost } from '@nestjs/bullmq';
import { PrismaService } from '../database/prisma.service';
import { ExtendedJob, JobTasksData } from './interfaces/tasks-queue.interface';

@Processor('tasks-queue', {
  removeOnComplete: {
    count: 1,
  },
  removeOnFail: {
    count: 5,
  },
})
export class TasksQueueProcessor extends WorkerHost {
  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: ExtendedJob<JobTasksData>) {
    try {
      console.log(`Processing Job... \n ID: ${job.id} \n Name: ${job.name}`);
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
      console.log(`Job with ID ${job.id} successfully processed.`);
    } catch (err) {
      console.error(`Job with ID ${job.id} failed: ${err}`);
    }
  }
}
