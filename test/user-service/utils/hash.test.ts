import { describe, it, expect } from 'vitest'; 
import { hashPassword } from '../../../src/user-service/src/utils/hash.ts';



describe('Password hashing',() => {

  it('hashes password correctly', async () => {
    const password = 'MyS3cr3tP@ss!';
    const hashed = await hashPassword(password);

    expect(hashed).not.toBe(password);
    expect(hashed).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt hash format
  });

  it('produces different hashes for the same password', async () => {
    const password = 'MyS3cr3tP@ss!';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);
  });

  it('handles empty password', async () => {
    const password = '';
    const hashed = await hashPassword(password);

    expect(hashed).not.toBe(password);
    expect(hashed).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt hash format
  });


});