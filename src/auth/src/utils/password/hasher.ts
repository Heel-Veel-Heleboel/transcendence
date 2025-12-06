import bcrypt from 'bcryptjs';

export async function hasher(str: string, saltRounds: number): Promise<string> {
  
  if (!Number.isInteger(saltRounds)) {
    throw new Error(`Invalid salt version: ${saltRounds}`);
  }
  if (saltRounds < 4 || saltRounds > 18) {
    throw new Error(`Salt rounds must be between 4 and 18, got: ${saltRounds}`);
  }
  return await bcrypt.hash(str, saltRounds);
}

export async function compareHash(str: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(str, hash);
}