import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { ResponseInterface } from 'src/common/interfaces/response.interface';
import { JobService } from './jobs.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import type { UserPayload } from '../auth/interfaces/auth.interface';
import { CacheService } from 'src/core/cache/cache.service';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { type GetJobsLogDto, GetJobLogsSchema } from './dto/job.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private jobService: JobService, private cache: CacheService) {}

  @Get()
  async getJobsLog(
    @Req() req: UserPayload,
    @Query(new ZodValidationPipe(GetJobLogsSchema)) getJobsLogDto: GetJobsLogDto,
  ): Promise<ResponseInterface<object>> {
    const redisKey = getJobsLogDto.useCursorPagination
      ? `cache:jobs:${req.user.sub}:get-jobs-log:cursor:${JSON.stringify(getJobsLogDto.cursor)}:limit:${getJobsLogDto.limit}`
      : `cache:jobs:${req.user.sub}:get-jobs-log:page:${getJobsLogDto.page}:limit:${getJobsLogDto.limit}`;
    const cachedValue = await this.cache.get(redisKey) as Promise<ResponseInterface<object>>;
    if (await cachedValue) {
      return cachedValue;
    }

    const jobs = await this.jobService.getJobsLog({
      userId: req.user.sub,
      page: getJobsLogDto.page,
      limit: getJobsLogDto.limit,
      useCursorPagination: getJobsLogDto.useCursorPagination,
      cursor: getJobsLogDto.cursor,
    });

    const response = {
      success: true,
      data: jobs,
      message: 'Jobs successfully retrieved.',
    };

    await this.cache.set(redisKey, response);

    return response;
  }

  /**
   * UNUSED
   */
  // @Sse('track')
  // streamJobs(): Observable<SseEvent> {
    // return this.notificationService.getNotification();
    // return interval(1000).pipe(
    //   map((_) => ({
    //     data: 'ping',
    //   })),
    // );
  // }
}
