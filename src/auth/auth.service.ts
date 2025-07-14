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
    // Sanitizar input antes da consulta
    const sanitizedEmail = this.sanitizeInput(loginUserDto.email);
    const sanitizedPassword = this.sanitizeInput(loginUserDto.password);

    const user = await this.prisma.user.findUnique({
      where: { email: sanitizedEmail },
      include: {
        mentor: { select: { id: true } },
      },
    });

    if (!user) return null;

    if (user.password === sanitizedPassword) {
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

  private sanitizeInput(input: string): string {
    if (!input) return input;
    
    // Remover caracteres perigosos para SQL injection
    return input
      .replace(/['";\\]/g, '') // Remove aspas e ponto e vírgula
      .replace(/--/g, '')      // Remove comentários SQL
      .replace(/\/\*/g, '')    // Remove comentários SQL
      .replace(/\*\//g, '')    // Remove comentários SQL
      .trim();
  }
}
