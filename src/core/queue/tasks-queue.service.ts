import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JobTasksData } from './interfaces/tasks-queue.interface';

@Injectable()
export class TasksQueueService {
  constructor(
    @InjectQueue('tasks-queue')
    private readonly tasksQueue: Queue,
  ) {}

  async addJob(data: JobTasksData) {
    await this.tasksQueue.add('create-tasks', data);
  }
}
