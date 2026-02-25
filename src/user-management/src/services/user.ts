import { UserRepository } from '../repositories/user.js';
import * as SchemaTypes  from '../schemas/user.services.js';

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(input: SchemaTypes.CreateUserSchemaType): Promise<{ id: number }> {
    return await this.userRepository.create( { email: input.user_email, name: input.user_name });
  }

  async deleteUser(schema: SchemaTypes.FindUserByIdSchemaType): Promise<void> {
    await this.userRepository.delete({ id: schema.user_id });
  }

  async updateUser(input: SchemaTypes.UpdateUserSchemaType): Promise<void> {
    if (!input.user_email && !input.user_name) {
      throw new Error('At least one field (email or name) must be provided for update.');
    }
    await this.userRepository.update({ id: input.user_id, email: input.user_email, name: input.user_name });
  }

  async updateStatus(input: SchemaTypes.UpdateUserStatusSchemaType): Promise<void> {
    await this.userRepository.updateStatus({ id: input.user_id, activity_status: input.activity_status });
  }

  async findUserById(schema: SchemaTypes.FindUserByIdSchemaType) {
    return await this.userRepository.findById(schema.user_id);
  }

  async findUserByEmail(schema: SchemaTypes.FindUserByEmailSchemaType) {
    return await this.userRepository.findByEmail(schema.user_email);
  }

  async findUserByName(schema: SchemaTypes.FindUserByNameSchemaType) {
    return await this.userRepository.findByName(schema.user_name);
  }

  async findUsersByStatus(schema: SchemaTypes.FindUsersByStatusSchemaType) {
    return await this.userRepository.findByStatus({ activity_status: schema.activity_status });
  }
}