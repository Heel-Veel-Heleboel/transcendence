import { CredentialsDaoShape } from './credentials-contract.js';
import { PrismaClient } from '../../generated/prisma/client.js';
import { CreatePasswordDto, UpdatePasswordDto, DeletePasswordDto } from './auth.dto.js';


export class CredentialsDao implements CredentialsDaoShape {

  constructor(private readonly prismaClient: PrismaClient) {}

  async create(data: CreatePasswordDto): Promise<void> {
    await this.prismaClient.userCredentials.create({
      data: {
        userId: data.userId,
        hashedPassword: data.password
      }
    });
  }

  async updatePassword(data: UpdatePasswordDto): Promise<void> {
    await this.prismaClient.userCredentials.update({
      where: { userId: data.userId },
      data: { hashedPassword: data.newPassword }
    });
  }

  async findByUserId(userId: number): Promise<string | null> {
    const record = await this.prismaClient.userCredentials.findUnique({
      where: { userId }
    });
    return record ? record.hashedPassword : null;
  }

  async deleteByUserId(userId: DeletePasswordDto): Promise<void> {
    await this.prismaClient.userCredentials.delete({
      where: { userId: userId.userId }
    });
  }
};