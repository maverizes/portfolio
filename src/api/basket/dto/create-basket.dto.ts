import { IsUUID, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBasketDto {
  @ApiProperty({
    description: 'Mahsulotning UUID shaklidagi IDsi',
    example: 'a3f0c999-4d44-4cfa-bbd4-4c9db0b6b9d6',
  })
  @IsUUID()
  productId: string;
}
