import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({ example: 'fulaninhodasilva' })
  @IsString()
  email!: string;

  @ApiProperty({ example: 'strongPassword123' })
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}
