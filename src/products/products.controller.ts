import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put, Res } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {

  constructor(private readonly productService: ProductsService) {
  }

  @HttpCode(200)
  @Post()
  async updateProduct(@Body() updateProductDto, @Res() res){
    // TODo comprueba que envia el webhook
    // global.console.log(JSON.parse(updateProductDto.payload));
    const response = await this.productService.updateProduct(JSON.parse(updateProductDto.payload));
    global.console.log(JSON.parse(response.toJSON().body));
    res.status(HttpStatus.OK).json([]);
  }

}
