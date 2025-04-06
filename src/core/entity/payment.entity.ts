import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/database/BaseEntity';
import { OrderItemEntity } from './order-item.entity';
import { PaymentStatus } from 'src/common/database/Enums';

@Entity({ name: 'payments' })
export class PaymentEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    totalSum: number;

    @Column({ type: 'varchar', length: 255 })
    transactionId: string;

    @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
    status: PaymentStatus;

    @OneToMany(() => OrderItemEntity, (orderItem) => orderItem.payment)
    orderItems: OrderItemEntity[];
}
