import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards, UsePipes } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { TaskService } from './tasks.service';
import { ResponseInterface } from 'src/common/interfaces/response.interface';
import type { UserPayload } from 'src/modules/auth/interfaces/auth.interface';
import { type CreateTaskDto, CreateTaskSchema, type GetTasksDto, GetTasksSchema, type UpdateTaskDto, UpdateTaskSchema } from './dto/task.dto';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { CacheService } from 'src/core/cache/cache.service';

interface TaskMutationData {
  id: string;
  title: string;
  categoryId: string | null;
  description: string | null;
}

interface TaskListItemData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  category: string | null;
}

interface TaskStatusData {
  id: string;
  status: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private taskService: TaskService, private cache: CacheService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(CreateTaskSchema))
  async createTask(@Req() req: UserPayload, @Body() createTaskDto: CreateTaskDto): Promise<ResponseInterface<TaskMutationData>> {
    const createTask = await this.taskService.createTask({
      userId: req.user.sub,
      title: createTaskDto.title,
      description: createTaskDto.description,
      categoryId: createTaskDto.categoryId,
    });

    await this.cache.delete(`cache:tasks:${req.user.sub}:get-tasks`);

    return {
      success: true,
      data: {
        id: createTask.task_id,
        title: createTask.task_title,
        categoryId: createTask.category_id || null,
        description: createTask.task_description,
      },
      message: 'Task created successfully.',
    };
  }

  @Get()
  @UsePipes(new ZodValidationPipe(GetTasksSchema))
  async getTasks(@Req() req: UserPayload, @Query() getTasksDto: GetTasksDto): Promise<ResponseInterface<TaskListItemData[]>> {
    const redisKey = `cache:tasks:${req.user.sub}:get-tasks`;
    const cachedValue = await this.cache.get(redisKey);
    if (cachedValue) {
      return cachedValue as Promise<ResponseInterface<TaskListItemData[]>>;
    }

    const tasks = await this.taskService.getTasks({
      userId: req.user.sub,
      page: Number(getTasksDto.page),
      limit: Number(getTasksDto.limit),
      status: getTasksDto.status,
    });

    const response = {
      success: true,
      data: tasks.map((task) => ({
        id: task.task_id,
        title: task.task_title,
        description: task.task_description,
        status: task.task_status,
        category: task.category?.category_name ?? null,
      })),
      message: 'Tasks retrieved successfully.',
    };
    await this.cache.set(redisKey, response);
    return response;
  }

  @Get(':taskId')
  async getTaskById(@Req() req: UserPayload, @Param('taskId') taskId: string): Promise<ResponseInterface<TaskListItemData>> {
    const redisKey = `cache:tasks:${req.user.sub}:get-task:${taskId}`;
    const cachedValue = await this.cache.get(redisKey);
    if (cachedValue) {
      return cachedValue as Promise<ResponseInterface<TaskListItemData>>;
    }

    const task = await this.taskService.getTaskById({
      userId: req.user.sub,
      taskId,
    });

    const response = {
      success: true,
      data: {
        id: task.task_id,
        title: task.task_title,
        description: task.task_description,
        status: task.task_status,
        category: task.category?.category_name ?? null,
      },
      message: 'Task retrieved successfully.',
    };
    await this.cache.set(redisKey, response);
    return response;
  }

  @Patch(':taskId')
  async updateTask(@Req() req: UserPayload, @Param('taskId') taskId: string, @Body(new ZodValidationPipe(UpdateTaskSchema)) updateTaskDto: UpdateTaskDto): Promise<ResponseInterface<TaskMutationData>> {
    const updateTask = await this.taskService.updateTask({
      userId: req.user.sub,
      taskId,
      title: updateTaskDto.title,
      description: updateTaskDto.description,
      categoryId: updateTaskDto.categoryId,
    });

    await this.cache.delete(`cache:tasks:${req.user.sub}:get-task:${taskId}`);

    return {
      success: true,
      data: {
        id: updateTask.task_id,
        title: updateTask.task_title,
        categoryId: updateTask.category_id || null,
        description: updateTask.task_description,
      },
      message: 'Task updated successfully.',
    };
  }

  @Patch('check/:taskId')
  async checkUncheckTask(@Req() req: UserPayload, @Param('taskId') taskId: string): Promise<ResponseInterface<TaskStatusData>> {
    const checkTask = await this.taskService.checkUncheckTask({
      userId: req.user.sub,
      taskId,
    });

    await this.cache.delete(`cache:tasks:${req.user.sub}:get-task:${taskId}`);

    return {
      success: true,
      data: {
        id: checkTask.task_id,
        status: checkTask.task_status,
      },
      message: `Task ${checkTask.task_status === 'FINISHED' ? 'checked' : 'unchecked'}.`,
    };
  }

  @Delete(':taskId')
  async deleteTask(@Req() req: UserPayload, @Param('taskId') taskId: string): Promise<ResponseInterface<TaskMutationData>> {
    const taskDeletion = await this.taskService.deleteTask({
      taskId,
      userId: req.user.sub,
    });

    return {
      success: true,
      data: {
        id: taskDeletion.task_id,
        title: taskDeletion.task_title,
        categoryId: taskDeletion.category_id || null,
        description: taskDeletion.task_description,
      },
      message: 'Task deleted successfully.',
    };
  }
}
