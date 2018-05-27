import { Body, Controller, Post, Req, Res, HttpStatus } from '@nestjs/common';
import { InitLoadService } from './init-load.service';

@Controller('init-load')
export class InitLoadController {

  constructor(private readonly initLoadService: InitLoadService) {
  }

  @Post()
  async execute(@Res() res) {
    const workComplete = await this.initLoadService.execute();
    if (workComplete) {
      res.status(HttpStatus.OK).send(workComplete);
    } else {
      res.status(HttpStatus.NOT_ACCEPTABLE).json([]);
    }
  }


}
