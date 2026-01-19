import { CredentialsDaoShape } from '../types/daos/credentials.js';
import { PrismaClient, UserCredentials } from '../../generated/prisma/client.js';
import { CreatePasswordDto, UpdatePasswordDto, DeletePasswordDto, FindPasswordDto } from '../types/dtos/credentials.js';



/**
 * Data Access Object (DAO) implementation for managing user credentials.
 * Implements methods for creating, updating, finding, and deleting user passwords using Prisma ORM.
 * Methods:
 * - create: Creates a new user password record.
 * - updatePassword: Updates an existing user's password. 
 * - findByUserId: Finds a user's password by their user ID.
 * - deleteByuser_id: Deletes a user's password record by their user ID.
 */

export class CredentialsDao implements CredentialsDaoShape {

  constructor(private readonly prismaClient: PrismaClient) {}

  async create(data: CreatePasswordDto): Promise<void> {
    await this.prismaClient.userCredentials.create({
      data: {
        user_id: data.user_id,
        hashed_password: data.password
      }
    });
  }

  async updatePassword(data: UpdatePasswordDto): Promise<void> {
    await this.prismaClient.userCredentials.update({
      where: { user_id: data.user_id },
      data: { hashed_password: data.new_password }
    });
  }

  async findByUserId(data: FindPasswordDto): Promise<UserCredentials | null> {
    const record = await this.prismaClient.userCredentials.findUnique({
      where: { user_id: data.user_id }
    });
    return record;
  }

  async deleteByUserId(data: DeletePasswordDto): Promise<void> {
    await this.prismaClient.userCredentials.delete({
      where: { user_id: data.user_id }
    });
  }
};