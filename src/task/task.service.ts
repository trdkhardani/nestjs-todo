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
}
