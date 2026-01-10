import { expect, it, describe } from 'vitest';
import { validateRefreshTokenFormat } from '../../../src/auth/src/utils/jwt.js';

describe('validateRefreshTokenFormat', () => {
  it.each([
    '',
    'invalidtokenformat',
    '550e8400-e29b-41d4-a716-446655440000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',// Missing dot
    '550e8400-e29b-41d4-a716-446655440000', // Missing dot and token part
    '550e8400-e29b-41d4-a716-446655440000.', // Missing token part
    '.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', // Missing UUID part
    '550e8400-e29b-41d4-a716-446655440000.aaaa', // Token part too short
    '550e8400-e29b-41d4-a716-446655440000.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', // Token part too long
    'not-a-uuid.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' // Invalid UUID
  ])('should return false for invalid token format: "%s"', (invalidToken) => {
    expect(validateRefreshTokenFormat(invalidToken)).toBe(null);
  });
  
  it('should return true for valid token format', () => { 
    const validToken = '550e8400-e29b-41d4-a716-446655440000.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    expect(validateRefreshTokenFormat(validToken)).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

});

