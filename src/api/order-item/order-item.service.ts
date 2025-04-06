import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItemEntity } from 'src/core/entity/order-item.entity';
import { ProductEntity } from 'src/core/entity/product.entity';
import { UserEntity } from 'src/core/entity/user.entity';
import { PaymentStatus, ResponseTypes, Roles } from 'src/common/database/Enums';
import { responseByLang } from 'src/infrastructure/prompts/responsePrompts';
import { PaymentEntity } from 'src/core/entity';
import { BasketService } from '../basket/basket.service';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class OrderItemService {
  constructor(
    @InjectRepository(OrderItemEntity)
    private readonly orderItemRepository: Repository<OrderItemEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
    private readonly paymentService: PaymentService,
    private readonly basketService: BasketService,
  ) { }
  async createOrder(user: UserEntity, lang: string) {
    // Foydalanuvchining basketini olish
    const basketData = await this.basketService.getBasket(user, lang);

    if (!basketData.data.length) {
      throw new NotFoundException(responseByLang(ResponseTypes.NO_DATA, lang));
    }

    // Basketni to‘lov uchun mos shaklga keltirish
    const basket = basketData.data.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
    }));

    // To‘lovni boshlash
    const paymentResponse = await this.paymentService.preparePayment(
      `ORDER_${Date.now()}`, // shopTransactionId
      basket.reduce((sum, item) => sum + item.price, 0), // Jami summa
      { email: user.email, phone: user.phone }, // User ma’lumotlari
      basket, // To‘lov uchun basket
    );

    return paymentResponse;
  }


  async updatePaymentStatus(paymentId: string, transactionId: string, status: PaymentStatus, lang: string) {
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId, is_deleted: false } });

    if (!payment) {
      throw new NotFoundException(responseByLang(ResponseTypes.NOT_FOUND, lang));
    }

    payment.status = status;
    payment.transactionId = transactionId;
    payment.updated_at = Date.now();

    await this.paymentRepository.save(payment);
    await this.orderItemRepository.update({ payment: payment }, { payment_status: status });

    return { data: payment, status_code: 200, message: responseByLang(ResponseTypes.UPDATE, lang) };
  }

  // **1️⃣ Create Order Item**
  // async createOrderItem(createOrderItemDto: CreateOrderItemDto, user: UserEntity, lang: string) {
  //   const { productId } = createOrderItemDto;

  //   const product = await this.productRepository.findOne({
  //     where: { id: productId, is_deleted: false },
  //   });

  //   if (!product) {
  //     throw new NotFoundException(responseByLang(ResponseTypes.PRODUCT_NOT_FOUND, lang));
  //   }

  //   const orderItem = this.orderItemRepository.create({
  //     product,
  //     created_by: user,
  //     created_at: Date.now(),
  //   });

  //     await this.orderItemRepository.save(orderItem);

  // return { data: orderItem, status_code: 201, message: responseByLang(ResponseTypes.CREATE, lang) };
  //   }

  // **2️⃣ Get all Order Items (Admin only)**
  async getAllOrderItems(lang: string) {
    const orderItems = await this.orderItemRepository.find({
      relations: ['product'],
    });

    return { data: orderItems, status_code: 200, message: responseByLang(ResponseTypes.FETCH_ALL, lang) };
  }


  // **4️⃣ Get Order Item by ID**
  async getOrderItemById(id: string, currentUser: UserEntity, lang: string) {
    const orderItem = await this.orderItemRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['user', 'product'],
    });

    if (!orderItem) {
      throw new NotFoundException(responseByLang(ResponseTypes.NOT_FOUND, lang));
    }

    return { data: orderItem, status_code: 200, message: responseByLang(ResponseTypes.FETCH_ONE, lang) };
  }
  // **4️⃣ Get Order Item by ID**
  async getOrderItemByUserId(currentUser: UserEntity, lang: string) {
    const orderItem = await this.orderItemRepository.findOne({
      where: { created_by: currentUser, is_deleted: false },
      relations: ['product'],
    });

    if (!orderItem) {
      throw new NotFoundException(responseByLang(ResponseTypes.NOT_FOUND, lang));
    }

    return { data: orderItem, status_code: 200, message: responseByLang(ResponseTypes.FETCH_ONE, lang) };
  }

  // **5️⃣ Delete Order Item**
  async deleteOrderItem(id: string, currentUser: UserEntity, lang: string) {
    if (currentUser.role !== Roles.ADMIN) {
      throw new ForbiddenException(responseByLang(ResponseTypes.FORBIDDEN, lang));
    }

    const orderItem = await this.orderItemRepository.findOne({ where: { id } });

    if (!orderItem) {
      throw new NotFoundException(responseByLang(ResponseTypes.NOT_FOUND, lang));
    }

    orderItem.is_deleted = true;
    orderItem.deleted_by = currentUser;
    orderItem.deleted_at = Date.now();

    await this.orderItemRepository.save(orderItem);

    return { data: null, status_code: 200, message: responseByLang(ResponseTypes.DELETE, lang) };
  }


  // async createOrderItem(createOrderItemDto: CreateOrderItemDto, user: UserEntity, lang: string) {
  //   const { productId } = createOrderItemDto;

  //   const product = await this.productRepository.findOne({
  //     where: { id: productId, is_deleted: false },
  //   });

  //   if (!product) {
  //     throw new NotFoundException(responseByLang(ResponseTypes.PRODUCT_NOT_FOUND, lang));
  //   }

  //   // Yangi Payment yaratish
  //   const payment = this.paymentRepository.create({
  //     totalSum: product.price,
  //     transactionId: '', // To'lov amalga oshirilgandan keyin to‘ldiriladi
  //     status: PaymentStatus.PENDING,
  //     created_by: user,
  //     created_at: Date.now(),
  //   });

  //   await this.paymentRepository.save(payment);

  //   const orderItem = this.orderItemRepository.create({
  //     product,
  //     price: product.price,
  //     payment,
  //     payment_status: PaymentStatus.PENDING,
  //     created_by: user,
  //     created_at: Date.now(),
  //   });

  //   await this.orderItemRepository.save(orderItem);

  //   return { data: orderItem, status_code: 201, message: responseByLang(ResponseTypes.CREATE, lang) };
  // }

  // // **2️⃣ Update Payment Status**
  // async updatePaymentStatus(paymentId: string, transactionId: string, status: PaymentStatus, lang: string) {
  //   const payment = await this.paymentRepository.findOne({ where: { id: paymentId, is_deleted: false } });

  //   if (!payment) {
  //     throw new NotFoundException(responseByLang(ResponseTypes.NOT_FOUND, lang));
  //   }

  //   payment.status = status;
  //   payment.transactionId = transactionId;
  //   payment.updated_at = Date.now();

  //   await this.paymentRepository.save(payment);

  //   // Barcha tegishli order item-larni yangilash
  //   await this.orderItemRepository.update({ payment: payment }, { payment_status: status });

  //   return { data: payment, status_code: 200, message: responseByLang(ResponseTypes.UPDATE, lang) };
  // }
}
