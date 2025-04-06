import {
    Injectable,
    NotFoundException,
    ConflictException,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { config } from 'src/config';
import { RegisterDto } from './dto/register.dto';
import { BcryptEncryption } from 'src/infrastructure/bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/core/entity';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { CustomMailerService } from 'src/infrastructure/mail/mail.service';
import { RedisCacheService } from 'src/infrastructure/redis/redis.service';

@Injectable()
export class AuthService {
    redis: RedisCacheService;
    mailerService: CustomMailerService;
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
        private readonly jwtService: JwtService,
        private readonly redisService: RedisCacheService,
        private readonly customMailerService: CustomMailerService,
    ) { }

    // ✅ Register user (no OTP)
    async register(registerDto: RegisterDto) {
        const { email, password, name } = registerDto;
        const existingUser = await this.userRepository.findOne({ where: { email } });

        if (existingUser) {
            throw new ConflictException('Email already registered.');
        }

        const hashedPassword = await BcryptEncryption.encrypt(password);
        const user = this.userRepository.create({ email, password: hashedPassword, name });
        await this.userRepository.save(user);

        return { message: 'User registered successfully.' };
    }

    // ✅ Login Step 1: Verify credentials and send OTP
    async login(email: string, password: string) {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new UnauthorizedException('Invalid email or password.');
        }

        const isPasswordValid = await BcryptEncryption.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password.');
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await this.redisService.set(`login_otp:${user.id}`, otp, 300); // 5 min

        await this.customMailerService.sendOtpEmail(user.email, otp);

        return {
            message: 'OTP sent to your email.',
            userId: user.id,
        };
    }

    // ✅ Login Step 2: Verify OTP and return tokens
    async verifyLoginOtp(userId: string, otp: string) {
        const storedOtp = await this.redisService.get(`login_otp:${userId}`);
        if (!storedOtp || storedOtp !== otp) {
            throw new UnauthorizedException('Invalid or expired OTP.');
        }

        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found.');
        }

        await this.redisService.deleteByText(`login_otp:${userId}`);

        return this.generateTokens(user.id, user.email, user.role);
    }

    // ✅ Update password
    async updatePassword(userId: string, updatePasswordDto: UpdatePasswordDto) {
        const { currentPassword, newPassword } = updatePasswordDto;
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new UnauthorizedException('User not found.');
        }

        const isPasswordValid = await BcryptEncryption.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Current password is incorrect.');
        }

        user.password = await BcryptEncryption.encrypt(newPassword);
        await this.userRepository.save(user);

        return { message: 'Password updated successfully.' };
    }

    // ✅ Forgot password - Send reset link
    async forgotPassword(email: string) {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new NotFoundException('User with this email not found.');
        }

        const resetToken = this.jwtService.sign(
            { id: user.id, email: user.email },
            {
                secret: config.ACCESS_TOKEN_SECRET_KEY,
                expiresIn: '15m',
            },
        );

        await this.redisService.set(`reset_token:${user.id}`, resetToken, 900);

        await this.customMailerService.sendPasswordResetEmail(user.email, resetToken);

        return { message: 'Password reset link sent to email.' };
    }

    // ✅ Reset password using token
    async resetPassword(token: string, newPassword: string) {
        let payload;
        try {
            payload = this.jwtService.verify(token, {
                secret: config.ACCESS_TOKEN_SECRET_KEY,
            });
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired token.');
        }

        const savedToken = await this.redisService.get(`reset_token:${payload.id}`);
        if (!savedToken || savedToken !== token) {
            throw new UnauthorizedException('Invalid or expired token.');
        }

        const user = await this.userRepository.findOne({ where: { id: payload.id } });
        if (!user) {
            throw new NotFoundException('User not found.');
        }

        user.password = await BcryptEncryption.encrypt(newPassword);
        await this.userRepository.save(user);

        await this.redisService.deleteByText(`reset_token:${payload.id}`);

        return { message: 'Password has been reset successfully.' };
    }

    async refreshToken(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: config.REFRESH_TOKEN_SECRET_KEY,
            });

            const savedToken = await this.redisService.get(`refresh_token:${payload.id}`);
            if (!savedToken || savedToken !== refreshToken) {
                throw new UnauthorizedException('Invalid refresh token.');
            }

            const user = await this.userRepository.findOne({ where: { id: payload.id } });
            if (!user) {
                throw new UnauthorizedException('User not found.');
            }

            const tokens = await this.generateTokens(user.id, user.email, user.role);

            await this.redisService.set(`refresh_token:${user.id}`, tokens.refreshToken, 604800); // 7 days

            return tokens;
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token.');
        }
    }
    async sendOtp(email: string) {
        const user = await this.userRepository.findOne({ where: { email } });

        if (!user) {
            throw new NotFoundException('Foydalanuvchi topilmadi.');
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
        await this.redisService.set(`otp-${user.id}`, otp, 300);

        await this.mailerService.sendOtpEmail(user.email, otp); // Use your mailer to send OTP

        return { message: 'OTP yuborildi' };
    }


    private async generateTokens(userId: string, email: string, role: string) {
        const payload = { id: userId, email, role };

        const accessToken = this.jwtService.sign(payload, {
            secret: config.ACCESS_TOKEN_SECRET_KEY,
            expiresIn: config.ACCESS_TOKEN_EXPIRE_TIME,
        });

        const refreshToken = this.jwtService.sign(payload, {
            secret: config.REFRESH_TOKEN_SECRET_KEY,
            expiresIn: config.REFRESH_TOKEN_EXPIRE_TIME,
        });

        await this.redisService.set(`refresh_token:${userId}`, refreshToken, 604800);

        return {
            accessToken,
            refreshToken,
        };
    }
}
