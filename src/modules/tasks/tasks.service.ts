import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import {
  CheckTaskInput,
  CreateTaskInput,
  DeleteTaskInput,
  GetTaskByIdInput,
  GetTasksInput,
  UpdateTaskInput,
} from './interfaces/task.interface';

type TaskMutation = Prisma.TaskGetPayload<{
  select: {
    task_id: true;
    task_title: true;
    task_description: true;
    category_id: true;
  };
}>;

type TaskListItem = Prisma.TaskGetPayload<{
  select: {
    task_id: true;
    task_title: true;
    task_description: true;
    task_status: true;
    category: {
      select: {
        category_name: true;
      };
    };
  };
}>;

type TaskStatus = Prisma.TaskGetPayload<{
  select: {
    task_id: true;
    task_status: true;
  };
}>;

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  async createTask(createTaskInput: CreateTaskInput): Promise<TaskMutation> {
    return await this.prisma.task.create({
      data: {
        task_title: createTaskInput.title,
        task_description: createTaskInput.description ?? null,
        user: {
          connect: {
            user_id: createTaskInput.userId,
          },
        },
        ...(createTaskInput.categoryId
          ? {
              category: {
                connect: {
                  category_id: createTaskInput.categoryId,
                },
              },
            }
          : {}),
      },
      select: {
        task_id: true,
        task_title: true,
        task_description: true,
        category_id: true,
      },
    });
  }

  async getTasks(getTasksInput: GetTasksInput): Promise<TaskListItem[]> {
    return await this.prisma.task.findMany({
      where: {
        user_id: getTasksInput.userId,
        ...(getTasksInput.status
          ? {
              task_status: getTasksInput.status,
            }
          : {}),
      },
      select: {
        task_id: true,
        task_title: true,
        task_description: true,
        task_status: true,
        category: {
          select: {
            category_name: true,
          },
        },
      },
      skip: ((getTasksInput.page ?? 1) - 1) * (getTasksInput.limit ?? 10),
      take: getTasksInput.limit ?? 10,
    });
  }

  async getTaskById(getTaskByIdInput: GetTaskByIdInput): Promise<TaskListItem> {
    const task = await this.prisma.task.findUnique({
      where: {
        task_id: getTaskByIdInput.taskId,
        user_id: getTaskByIdInput.userId,
      },
      select: {
        task_id: true,
        task_title: true,
        task_description: true,
        task_status: true,
        category: {
          select: {
            category_name: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found.', {
        description: `No task Found.`,
      });
    }

    return task;
  }

  async updateTask(updateTaskInput: UpdateTaskInput): Promise<TaskMutation> {
    return await this.prisma.task.update({
      where: {
        task_id: updateTaskInput.taskId,
        user_id: updateTaskInput.userId,
      },
      data: {
        task_title: updateTaskInput.title,
        task_description: updateTaskInput.description,
        ...(updateTaskInput.categoryId === null
          ? {
              category: {
                disconnect: true,
              },
            }
          : updateTaskInput.categoryId
            ? {
                category: {
                  connect: {
                    category_id: updateTaskInput.categoryId,
                  },
                },
              }
            : {}),
      },
      select: {
        task_id: true,
        task_title: true,
        task_description: true,
        category_id: true,
      },
    });
  }

  async checkUncheckTask(checkTaskInput: CheckTaskInput): Promise<TaskStatus> {
    const task = await this.prisma.task.findUnique({
      where: {
        task_id: checkTaskInput.taskId,
        user_id: checkTaskInput.userId,
      },
      select: {
        task_status: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found.', {
        description: `No task Found.`,
      });
    }

    return await this.prisma.task.update({
      where: {
        task_id: checkTaskInput.taskId,
        user_id: checkTaskInput.userId,
      },
      data: {
        task_status:
          task?.task_status === 'UNFINISHED' ? 'FINISHED' : 'UNFINISHED',
      },
      select: {
        task_id: true,
        task_status: true,
      },
    });
  }

  async deleteTask(deleteTaskInput: DeleteTaskInput): Promise<TaskMutation> {
    return await this.prisma.task.delete({
      where: {
        task_id: deleteTaskInput.taskId,
        user_id: deleteTaskInput.userId,
      },
      select: {
        task_id: true,
        task_title: true,
        task_description: true,
        category_id: true,
      },
    });
  }
}
