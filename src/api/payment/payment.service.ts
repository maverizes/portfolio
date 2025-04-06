import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import axios from 'axios';
import { config } from 'src/config';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly octoApiUrl = 'https://secure.octo.uz/prepare_payment';


  async preparePayment(
    shopTransactionId: string, 
    totalSum: number,
    userData: any,
    basket: any[],
  ) {
    const octoShopId = config.OCTO_SHOP_ID
    const octoSecret = config.OCTO_SECRET
    const octoReturnUrl = config.OCTO_RETURN_URL
    const octoNotifyUrl = config.OCTO_NOTIFY_URL

    const requestPayload = {
      octo_shop_id: octoShopId,
      octo_secret: octoSecret,
      shop_transaction_id: shopTransactionId,
      auto_capture: true,
      test: false,
      init_time: new Date().toISOString(),
      user_data: userData,
      total_sum: totalSum,
      currency: 'UZS',
      description: 'TEST_PAYMENT',
      basket,
      payment_methods: [
        { method: 'bank_card' },
      ],
      tsp_id: 18,
      return_url: octoReturnUrl,
      notify_url: octoNotifyUrl,
      language: 'uz',
      ttl: 15,
    };

    try {
      const response = await axios.post(this.octoApiUrl, requestPayload, {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error) {
      this.logger.error('Payment preparation failed', error.stack);
      throw new InternalServerErrorException('Payment preparation failed');
    }
  }
}
