import { UserRepository } from '../repositories/user.js';
import { ActivityStatus } from '../../generated/prisma/client.js';


export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(email: string, name: string): Promise<{ id: number }> {
    return await this.userRepository.create({ email, name });
  }

  async deleteUser(id: number): Promise<void> {
    await this.userRepository.delete({ id });
  }

  async updateUser(id: number, email?: string, name?: string): Promise<void> {
    if (!email && !name) {
      throw new Error('At least one field (email or name) must be provided for update.');
    }
    await this.userRepository.update({ id, email, name });
  }

  async updateStatus(id: number, activity_status: ActivityStatus): Promise<void> {
    await this.userRepository.updateStatus({ id, activity_status });
  }

  async findUserById(id: number) {
    return await this.userRepository.findById(id);
  }

  async findUserByEmail(email: string) {
    return await this.userRepository.findByEmail(email);
  }

  async findUserByName(name: string) {
    return await this.userRepository.findByName(name);
  }

  async findUsersByStatus(activity_status?: ActivityStatus) {
    return await this.userRepository.findByStatus({ activity_status });
  }

}