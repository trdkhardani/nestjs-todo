import { Module } from '@nestjs/common';
import { WsGateway } from './ws.gateway';

@Module({
  imports: [],
  controllers: [],
  providers: [WsGateway],
  exports: [WsGateway],
})
export class WsModule {}
