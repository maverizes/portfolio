import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ProductEntity } from 'src/core/entity/product.entity';
import { BaseEntity } from '../../common/database/BaseEntity';
import { PaymentEntity } from './payment.entity';
import { PaymentStatus } from 'src/common/database/Enums';

@Entity({ name: 'order_items' })
export class OrderItemEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => ProductEntity, { eager: true, nullable: true })
    product?: ProductEntity;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @ManyToOne(() => PaymentEntity, (payment) => payment.orderItems, { nullable: true })
    payment?: PaymentEntity;

    @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
    payment_status: PaymentStatus
}
