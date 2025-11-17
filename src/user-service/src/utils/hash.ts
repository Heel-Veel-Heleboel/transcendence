import bcrypt from 'bcrypt';

export async function  hashPassword(password: string) : Promise<string> {
  const salt = 10;
  // if (!password) {
  //   throw new Error('Password cannot be empty!');
  // }
  return (bcrypt.hash(password, salt));
}