import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateOrderItemDto {
    @ApiProperty({ example: 'product-id-456', description: 'The ID of the product' })
    @IsString()
    @IsNotEmpty()
    productId: string;
}
