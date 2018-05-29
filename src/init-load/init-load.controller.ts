import { Body, Controller, Post, Req, Res, HttpStatus } from '@nestjs/common';
import { InitLoadService } from './init-load.service';

@Controller('init-load')
export class InitLoadController {

  constructor(private readonly initLoadService: InitLoadService) {
  }

  @Post()
  async execute(@Res() res) {
    global.console.log('entro');
    this.initLoadService.execute();
    res.status(HttpStatus.NO_CONTENT).redirect('https://ekistudio.com/sardarabad/wp-admin/');
  }
}
