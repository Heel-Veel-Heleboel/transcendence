import { UserDaoShape } from './user.dao.js';
import { PrismaClient, User } from '../../generated/prisma/client.js';
import { CreateUserDto, SafeUserDto, UpdatePasswordDto, UpdateRefreshTokenDto } from './user.dto.js';


export class PrismaUserDao implements UserDaoShape { 
  constructor(private readonly prismaClient: PrismaClient) {}

  async create(data: CreateUserDto): Promise<SafeUserDto> {
    const user = await this.prismaClient.user.create({
      data: {
        email: data.email,
        password: data.password,
        username: data.username
      }
    });

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  async updatePassword(userId: number, userData: UpdatePasswordDto): Promise<void> {
    await this.prismaClient.user.update({
      where: { id: userId },
      data: { password: userData.password }
    });
  }
  async updateRefreshToken(userId: number, token: UpdateRefreshTokenDto): Promise<void> {
    this.prismaClient.user.update({
      where: { id: userId },
      data: { refreshToken: token.refreshToken }
    });
  }
  async findById(userId: number): Promise<SafeUserDto | null> {
    const user = await this.prismaClient.user.findUnique({
      where: { id: userId }
    });
    return user ? this.toDto(user) : null;
  }

  async findByEmail(email: string): Promise<SafeUserDto | null> {
    const user = await this.prismaClient.user.findUnique({
      where: { email }
    });
    return user ? this.toDto(user) : null;
  }

  private toDto(user: User): SafeUserDto {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
};