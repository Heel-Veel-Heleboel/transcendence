import { describe, it, expect } from 'vitest';
import { comparePassword, hashPassword } from '../../../src/user-service/src/utils/password-utils.ts';

describe('Password comparison', () => {

  it('should return true for matching password and hash', async () => {
    const plainPassword = 'Password@42';
    const hashedPassword = await hashPassword(plainPassword);
    
    const result = await comparePassword(plainPassword, hashedPassword);
    
    expect(result).toBe(true);
  });

  it('should return false for non-matching password and hash', async () => {
    const correctPassword = 'Password@42';
    const wrongPassword = 'WrongPassword@42';
    const hashedPassword = await hashPassword(correctPassword);
    
    const result = await comparePassword(wrongPassword, hashedPassword);
    
    expect(result).toBe(false);
  });

  it('should return false for empty password', async () => {
    const password = 'Password@42';
    const hashedPassword = await hashPassword(password);
    
    const result = await comparePassword('', hashedPassword);
    
    expect(result).toBe(false);
  });

  it('should handle different passwords correctly', async () => {
    const password1 = 'Password@42';
    const password2 = 'DifferentPassword@123';
    
    const hash1 = await hashPassword(password1);
    const hash2 = await hashPassword(password2);
    
    // Same password should match its own hash
    expect(await comparePassword(password1, hash1)).toBe(true);
    expect(await comparePassword(password2, hash2)).toBe(true);
    
    // Different passwords should not match each other's hash
    expect(await comparePassword(password1, hash2)).toBe(false);
    expect(await comparePassword(password2, hash1)).toBe(false);
  });
});