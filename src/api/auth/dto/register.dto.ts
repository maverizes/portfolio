import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MinLength,
    MaxLength,
    Matches,
} from 'class-validator';

export class RegisterDto {
    @ApiProperty({
        example: 'example@example.com',
        description: 'Foydalanuvchi email manzili',
    })
    @IsEmail({}, { message: 'Email manzil noto‘g‘ri formatda' })
    @IsNotEmpty({ message: 'Email manzili majburiy' })
    email: string;

    @ApiProperty({
        example: 'John',
        description: 'Foydalanuvchining ismi',
    })
    @IsString({ message: 'Ism matn shaklida bo‘lishi kerak' })
    @IsNotEmpty({ message: 'Ism majburiy' })
    name: string;

    @ApiProperty({
        example: 'Doe',
        description: 'Foydalanuvchining familiyasi',
    })


    @ApiProperty({
        example: 'StrongPassword123!',
        description: 'Foydalanuvchi paroli',
    })
    @IsString({ message: 'Parol matn shaklida bo‘lishi kerak' })
    @MinLength(8, {
        message: 'Parol kamida 8 ta belgidan iborat bo‘lishi kerak',
    })
    @MaxLength(32, {
        message: 'Parol maksimal 32 ta belgidan oshmasligi kerak',
    })
    @Matches(/(?=.*[a-z])/, {
        message: 'Parolda kamida bitta kichik harf bo‘lishi kerak',
    })
    @Matches(/(?=.*[A-Z])/, {
        message: 'Parolda kamida bitta katta harf bo‘lishi kerak',
    })
    @Matches(/(?=.*\d)/, {
        message: 'Parolda kamida bitta raqam bo‘lishi kerak',
    })
    @IsNotEmpty({ message: 'Parol majburiy' })
    password: string;
}
