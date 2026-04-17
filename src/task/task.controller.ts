import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards, UsePipes } from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { TaskService } from './task.service';
import { ResponseInterface } from 'src/interface/response';
import type { UserPayload } from 'src/interface/auth';
import { type CreateTaskDto, CreateTaskSchema, type GetTasksDto, GetTasksSchema, type UpdateTaskDto, UpdateTaskSchema } from 'src/dto/task.dto';
import { ZodValidationPipe } from 'src/pipes/zod-validation.pipe';

@Controller()
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(CreateTaskSchema))
  async createTask(@Req() req: UserPayload, @Body() createTaskDto: CreateTaskDto): Promise<ResponseInterface> {

    const createTask = await this.taskService.createTask({
      task_title: createTaskDto.taskTitle,
      task_description: createTaskDto.taskDescription || null,
      user: {
        connect: {
          user_id: req.user.userId,
        },
      },
      ...(createTaskDto.taskCategoryId
        ? {
            category: {
              connect: {
                category_id: createTaskDto.taskCategoryId,
              },
            },
          }
        : {}),
    });

    return {
      success: true,
      data: {
        taskId: createTask.task_id,
        taskTitle: createTask.task_title,
        taskCategoryId: createTask.category_id || null,
        taskDescription: createTask.task_description,
      },
      message: 'Task created successfully.',
    };
  }

  @Get()
  @UsePipes(new ZodValidationPipe(GetTasksSchema))
  async getTasks(@Req() req: UserPayload, @Query() getTasksDto: GetTasksDto): Promise<ResponseInterface> {
    const tasks = await this.taskService.getTasks(
      {
        user_id: req.user.userId,
        ...(getTasksDto.taskStatus
          ? {
              task_status: getTasksDto.taskStatus,
            }
          : {}),
      },
      {
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
      Number(getTasksDto.page),
      Number(getTasksDto.limit),
    );

    return {
      success: true,
      data: tasks,
      message: 'Tasks retrieved successfully.',
    };
  }

  @Get(':taskId')
  async getTaskById(@Req() req: UserPayload, @Param('taskId') taskId: string): Promise<ResponseInterface> {
    const task = await this.taskService.getTaskById(
      {
        user_id: req.user.userId,
        task_id: taskId,
      },
      {
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
    );

    return {
      success: true,
      data: task,
      message: 'Task retrieved successfully.',
    };
  }

  @Patch(':taskId')
  async updateTask(@Req() req: UserPayload, @Param('taskId') taskId: string, @Body(new ZodValidationPipe(UpdateTaskSchema)) updateTaskDto: UpdateTaskDto): Promise<ResponseInterface> {
    const updateTask = await this.taskService.updateTask(
      {
        user_id: req.user.userId,
        task_id: taskId,
      },
      {
        task_title: updateTaskDto.taskTitle,
        task_description: updateTaskDto.taskDescription,
        ...(updateTaskDto.taskCategoryId
          ? {
              category: {
                connect: {
                  category_id: updateTaskDto.taskCategoryId,
                },
              },
            }
          : {}),
      },
    );

    return {
      success: true,
      data: {
        taskId: updateTask.task_id,
        taskTitle: updateTask.task_title,
        taskCategoryId: updateTask.category_id || null,
        taskDescription: updateTask.task_description,
      },
      message: 'Task updated successfully.',
    };
  }

  @Patch('check/:taskId')
  async checkUncheckTask(@Req() req: UserPayload, @Param('taskId') taskId: string): Promise<ResponseInterface> {
    const checkTask = await this.taskService.checkUncheckTask(req.user.userId, taskId);

    return {
      success: true,
      data: {
        taskId: checkTask.task_id,
        taskStatus: checkTask.task_status,
      },
      message: `Task ${checkTask.task_status === 'FINISHED' ? 'checked' : 'unchecked'}.`,
    };
  }

  @Delete(':taskId')
  async deleteTask(@Req() req: UserPayload, @Param('taskId') taskId: string): Promise<ResponseInterface> {
    const taskDeletion = await this.taskService.deleteTask({
      task_id: taskId,
      user_id: req.user.userId,
    });

    return {
      success: true,
      data: {
        data: {
          taskId: taskDeletion.task_id,
          taskTitle: taskDeletion.task_title,
        },
      },
      message: 'Task deleted successfully.',
    };
  }
}
