import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { config } from 'src/config';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: config.EMAIL,
          pass: config.EMAIL_PASSWORD,
        },
      },
      defaults: {
        from: `"No Reply" <${config.EMAIL}>`,
      },
    }),
  ],
  exports: [MailerModule],
})
export class MailModule {}
