import { ICredentialsDao } from '../types/daos/credentials.js';
import { PrismaClient, UserCredentials } from '../../generated/prisma/client.js';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { CreatePasswordDto, UpdatePasswordDto, DeletePasswordDto, FindPasswordDto } from '../types/dtos/credentials.js';
import { ResourceNotFoundError, ResourceConflictError } from '../error/auth.js';


/**
 * Data Access Object (DAO) implementation for managing user credentials.
 * Implements methods for creating, updating, finding, and deleting user passwords using Prisma ORM.
 * Methods:
 * - create: Creates a new user password record.
 * - updatePassword: Updates an existing user's password. 
 * - findByUserId: Finds a user's password by their user ID.
 * - deleteByuser_id: Deletes a user's password record by their user ID.
 */

export class CredentialsDao implements ICredentialsDao {

  constructor(private readonly prismaClient: PrismaClient) {}

  async create(data: CreatePasswordDto): Promise<void> {
    try {
      await this.prismaClient.userCredentials.create({
        data: {
          user_id: data.user_id,
          hashed_password: data.password
        }
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ResourceConflictError(`Credentials already exist for user_id: ${data.user_id}`);
      }
      throw error;  
    }
  }

  async updatePassword(data: UpdatePasswordDto): Promise<void> {
    try {
      await this.prismaClient.userCredentials.update({
        where: { user_id: data.user_id },
        data: { hashed_password: data.new_password }
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new ResourceNotFoundError(`Credentials not found for user_id: ${data.user_id}`);
      }
      throw error;  
    }
  }

  async findByUserId(data: FindPasswordDto): Promise<UserCredentials | null> {
    const record = await this.prismaClient.userCredentials.findUnique({
      where: { user_id: data.user_id }
    });
    return record;
  }

  async deleteByUserId(data: DeletePasswordDto): Promise<void> {
    try {
      await this.prismaClient.userCredentials.delete({
        where: { user_id: data.user_id }
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new ResourceNotFoundError(`Credentials not found for user_id: ${data.user_id}`);
      }
      throw error;  
    }
  }
};