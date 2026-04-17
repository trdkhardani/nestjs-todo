import { Injectable } from '@nestjs/common';
import { Prisma, Task } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  async createTask(data: Prisma.TaskCreateInput): Promise<Task> {
    return await this.prisma.task.create({
      data,
    });
  }

  async getTasks(taskWhere: Prisma.TaskWhereInput, taskSelect: Prisma.TaskSelect, page: number, limit: number): Promise<Task[] | []> {
    return await this.prisma.task.findMany({
      where: taskWhere,
      select: taskSelect,
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async getTaskById(taskWhere: Prisma.TaskWhereUniqueInput, taskSelect: Prisma.TaskSelect): Promise<Task | null> {
    return await this.prisma.task.findUnique({
      where: taskWhere,
      select: taskSelect,
    });
  }

  async updateTask(taskWhere: Prisma.TaskWhereUniqueInput, data: Prisma.TaskUpdateInput): Promise<Task> {
    return await this.prisma.task.update({
      where: taskWhere,
      data,
    });
  }

  async checkUncheckTask(userId: string, taskId: string): Promise<Task> {
    const task = await this.getTaskById(
      {
        task_id: taskId,
        user_id: userId,
      },
      {
        task_status: true,
      },
    );

    return await this.updateTask(
      {
        task_id: taskId,
        user_id: userId,
      },
      {
        task_status:
          task?.task_status === 'UNFINISHED' ? 'FINISHED' : 'UNFINISHED',
      },
    );
  }

  async deleteTask(taskWhere: Prisma.TaskWhereUniqueInput): Promise<Task> {
    return await this.prisma.task.delete({
      where: taskWhere,
    });
  }
}
