import { HttpModule, Module } from '@nestjs/common';
import { InitLoadController } from './init-load.controller';
import { InitLoadService } from './init-load.service';

@Module({
  imports: [HttpModule],
  controllers: [InitLoadController],
  providers: [InitLoadService],
})
export class InitLoadModule {}
