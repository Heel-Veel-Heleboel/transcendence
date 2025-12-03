import bcrypt from 'bcryptjs';

export async function hasher(str: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(str, saltRounds);
}

export async function compareHash(str: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(str, hash);
}