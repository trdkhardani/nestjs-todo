/**
 * UNUSED
 */
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { Observable, Subject } from 'rxjs';

export interface SseEvent {
  data: string | object;
  id?: string;
  event?: string;
  retry?: number;
}

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly notification = new Subject<SseEvent>();
  constructor(
    @InjectRedis()
    private pubClient: Redis,
    @InjectRedis()
    private subClient: Redis,
  ) {}

  async onModuleInit() {
    this.pubClient = new Redis(); // publisher
    this.subClient = new Redis(); // subscriber

    await this.subClient.subscribe('notifications');

    this.subClient.on('message', (channel, message) => {
      if (channel === 'notifications') {
        this.notification.next({
          data: JSON.parse(message),
        });
      }
    });
  }

  async sendNotification(message: SseEvent) {
    await this.pubClient.publish('notifications', JSON.stringify(message));
  }

  getNotification(): Observable<SseEvent> {
    return this.notification.asObservable();
  }
}
