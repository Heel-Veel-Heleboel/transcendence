import { describe, it, expect } from 'vitest';

import { validatePassword } from '../../../src/user-service/src/utils/password-utils.js';

describe('Password validator',() => {

  it('validates a strong password successfully', () => {
    const result = validatePassword('StrongP@ssw0rd!');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails validation for a short password', () => {
    const result = validatePassword('Short1!');
    expect(result.valid).toBe(false);
    expect(result.errors).not.toHaveLength(0);
  });

  it('fails validation for a long password', () => {
    const result = validatePassword('ThisPasswordIsWayTooLongToBeAccepted123!');
    expect(result.valid).toBe(false);
    expect(result.errors).not.toHaveLength(0);
  });

  it('fails validation for a password without uppercase letters', () => {
    const result = validatePassword('weakp@ssw0rd');
    expect(result.valid).toBe(false);
    expect(result.errors).not.toHaveLength(0);
  });

  it('fails validation for a password without lowercase letters', () => {
    const result = validatePassword('WEAKP@SSW0RD');
    expect(result.valid).toBe(false);
    expect(result.errors).not.toHaveLength(0);
  });

  it('fails validation for a password without numbers', () => {
    const result = validatePassword('NoNumbers@');
    expect(result.valid).toBe(false);
    expect(result.errors).not.toHaveLength(0);
  });

  it('fails validation for a password without special characters', () => {
    const result = validatePassword('NoSpecial123');
    expect(result.valid).toBe(false);
    expect(result.errors).not.toHaveLength(0);
  });

  it('fails validation for a password with spaces', () => {
    const result = validatePassword('Has Spaces1!');
    expect(result.valid).toBe(false);
    expect(result.errors).not.toHaveLength(0);
  });

});
