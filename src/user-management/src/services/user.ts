import { UserRepository } from '../repositories/user.js';
import * as SchemaTypes  from '../schemas/user.js';
import { AuthClient } from '../client/auth.js';
import { ApiGatewayClient } from '../client/api-gateway.js';

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authClient: AuthClient,
    private readonly apiGatewayClient: ApiGatewayClient
  ) {}

  async createUser(input: SchemaTypes.CreateUserSchemaType): Promise<{ id: number }> {
    return await this.userRepository.create( { email: input.user_email, name: input.user_name });
  }

  async deleteUser(schema: SchemaTypes.FindUserByIdSchemaType): Promise<void> {
    await this.authClient.deleteAuthDataForUser(schema.user_id);
    await this.userRepository.delete({ id: schema.user_id });
  }



  async updateUserEmail(input: SchemaTypes.UpdateUserEmailSchemaType): Promise<void> {
    await this.userRepository.updateEmail({ id: input.user_id, email: input.user_email });
    await this.apiGatewayClient.notifyUsers([input.user_id], { type: 'USER_EMAIL_UPDATED', user_id: input.user_id, email: input.user_email });
  }



  async updateUserName(input: SchemaTypes.UpdateUserNameSchemaType): Promise<void> {
    await this.userRepository.updateName({ id: input.user_id, name: input.user_name });
    await this.apiGatewayClient.notifyUsers([input.user_id], { type: 'USER_NAME_UPDATED', user_id: input.user_id, name: input.user_name });
  }



  async updateStatus(input: SchemaTypes.UpdateUserStatusSchemaType): Promise<void> {
    await this.userRepository.updateStatus({ id: input.user_id, activity_status: input.activity_status });
    await this.apiGatewayClient.broadcastToAllUsers({ type: 'USER_STATUS_UPDATED', user_id: input.user_id, activity_status: input.activity_status });
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