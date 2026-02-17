import { UserRepository } from '../repositories/user.js';



export class UserManagementService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(email: string, name: string): Promise<{ id: number }> {
    return await this.userRepository.create({ email, name });
  }

}