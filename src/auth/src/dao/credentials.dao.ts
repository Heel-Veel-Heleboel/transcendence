import { CredentialsDaoShape } from '../contracts/credentials.js';
import { PrismaClient } from '../../generated/prisma/client.js';
import { CreatePasswordDto, UpdatePasswordDto, DeletePasswordDto, FindPasswordDto } from '../contracts/auth.dto.js';



/**
 * Data Access Object (DAO) implementation for managing user credentials.
 * Implements methods for creating, updating, finding, and deleting user passwords using Prisma ORM.
 * Methods:
 * - create: Creates a new user password record.
 * - updatePassword: Updates an existing user's password. 
 * - findByUserId: Finds a user's password by their user ID.
 * - deleteByUserId: Deletes a user's password record by their user ID.
 */

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

  async findByUserId(data: FindPasswordDto): Promise<string | null> {
    const record = await this.prismaClient.userCredentials.findUnique({
      where: { userId: data.userId }
    });
    return record ? record.hashedPassword : null;
  }

  async deleteByUserId(userId: DeletePasswordDto): Promise<void> {
    await this.prismaClient.userCredentials.delete({
      where: { userId: userId.userId }
    });
  }
};