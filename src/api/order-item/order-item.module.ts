import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { OrderItemService } from './order-item.service';
import { OrderItemController } from './order-item.controller';
import { BasketService } from '../basket/basket.service';
import { PaymentService } from '../payment/payment.service';
import { OrderItemEntity, PaymentEntity, ProductEntity } from 'src/core/entity';
import { BasketModule } from '../basket/basket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderItemEntity, ProductEntity, PaymentEntity]),
    BasketModule
  ],
  controllers: [OrderItemController],
  providers: [OrderItemService, PaymentService, BasketService,],
  exports: [OrderItemService],
})
export class OrderItemModule { }
