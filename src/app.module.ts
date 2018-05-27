import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InitLoadModule } from './init-load/init-load.module';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';

@Module({
  imports: [InitLoadModule, ProductsModule, InventoryModule],
  controllers: [AppController],
  providers: [ AppService ],
})
export class AppModule {}
