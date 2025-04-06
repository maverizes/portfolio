import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config } from 'src/config';
import { BasketEntity, CategoryEntity, CommentEntity, PaymentEntity, ProductEntity, UserEntity } from 'src/core/entity';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { RedisModule } from 'src/infrastructure/redis/redis.module';
import { MailModule } from 'src/infrastructure/mail/mail.module';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { JwtStrategy } from './auth/users/AuthStrategy';
import { JwtAuthGuard } from './auth/users/AuthGuard';
import { APP_GUARD } from '@nestjs/core';
import { OrderItemModule } from './order-item/order-item.module';
import { OrderItemEntity } from 'src/core/entity/order-item.entity';
import { BasketModule } from './basket/basket.module';
import { CommentModule } from './comment/comment.module';
import { ImageEntity } from 'src/core/entity/image.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: config.DB_URL,
      synchronize: true,
      entities: [UserEntity, CategoryEntity, ProductEntity, BasketEntity, OrderItemEntity, CommentEntity, ImageEntity, PaymentEntity],
      ssl: false
    }),
    AuthModule,
    UserModule,
    ProductModule,
    CategoryModule,
    RedisModule,
    BasketModule,
    MailModule,
    OrderItemModule,
    CommentModule,
  ],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // {
    //   provide: APP_GUARD,
    //   useClass: RolesGuard,
    // },
  ]
})
export class AppModule { }
