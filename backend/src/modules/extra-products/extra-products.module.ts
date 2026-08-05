import { Module } from '@nestjs/common';
import { ExtraProductsController } from './extra-products.controller';
import { ExtraProductsService } from './extra-products.service';

@Module({
  controllers: [ExtraProductsController],
  providers: [ExtraProductsService],
  exports: [ExtraProductsService],
})
export class ExtraProductsModule {}
