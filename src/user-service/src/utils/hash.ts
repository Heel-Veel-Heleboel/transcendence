import bcrypt from 'bcrypt';

export async function  hashPassword(password: string) : Promise<string> {
  const salt = 10;
  return (bcrypt.hash(password, salt));
}