import { Controller, Get, Sse } from '@nestjs/common';
import { interval, map, Observable } from 'rxjs';
import type { ResponseInterface } from 'src/common/interfaces/response.interface';
import { NotificationService, SseEvent } from 'src/core/queue/queue-notification.service';

@Controller()
export class JobsController {
  constructor(private notificationService: NotificationService) {}

  /**
   * UNUSED
   */
  @Sse('track')
  streamJobs(): Observable<SseEvent> {
    return this.notificationService.getNotification();
    // return interval(1000).pipe(
    //   map((_) => ({
    //     data: 'ping',
    //   })),
    // );
  }
}
