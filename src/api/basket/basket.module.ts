import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BasketService } from './basket.service';
import { BasketController } from './basket.controller';
import { BasketEntity, ProductEntity } from 'src/core/entity';

@Module({
  imports: [TypeOrmModule.forFeature([BasketEntity, ProductEntity])], // Entitylar qo‘shilgan
  controllers: [BasketController],
  providers: [BasketService],
  exports: [BasketService, TypeOrmModule],
})
export class BasketModule { }
