import { Injectable } from '@nestjs/common';
import { LoginUserDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(loginUserDto: LoginUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginUserDto.email },
      include: {
        mentor: { select: { id: true } },
      },
    });
    if (user && user.password === loginUserDto.password) {
      return user;
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      role: user.role,
      name: user.name,
      userId: user.id,
      mentor: user.mentor?.id ?? null,
    };
  }
}
