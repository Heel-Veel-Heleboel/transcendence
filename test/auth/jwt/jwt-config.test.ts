import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { createJwtConfig } from '../../../src/auth/src/config/jwt.ts';
import { JwtConfigShape } from '../../../src/auth/src/types/jwt.ts';
import { JwtSchemaErrorMessage } from '../../../src/auth/src/constants/jwt.ts';

vi.mock('../../../src/auth/src/utils/read-file.ts', () => {
  return {
    readFile: vi.fn(() => 'mocked-key-content')
  };
});

import { readFile } from '../../../src/auth/src/utils/read-file.ts';

const mockReadFile = vi.mocked(readFile);

describe('Jwt configuration tester', ()=> {

  
  const origEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...origEnv,
      JWT_PRIVATE_KEY_PATH: './keys/test-private.pem',
      JWT_PUBLIC_KEY_PATH: './keys/test-public.pem',
      EXPIRATION_TIME_ACCESS_TOKEN: '15m',
      EXPIRATION_TIME_REFRESH_TOKEN: '7d'
    };
    mockReadFile.mockReturnValue('mocked-key-content');
  });

  afterAll(() => {
    process.env = origEnv;
  });
  



   
  it ('Returns object with all properties with their values', ()=> {

    const result : JwtConfigShape = createJwtConfig();
    expect(result.privateKey).toContain('mocked-key-content');
    expect(result.publicKey).toContain('mocked-key-content');
    expect(result.expirationAccessToken).toBe(900000);
    expect(result.expirationRefreshToken).toBe(604800000);
  });

  const requiredVars = [
    { envName: 'JWT_PRIVATE_KEY_PATH', errorMsg: JwtSchemaErrorMessage.JWT_PRIVATE_KEY_PATH_MISSING },
    { envName: 'JWT_PUBLIC_KEY_PATH', errorMsg: JwtSchemaErrorMessage.JWT_PUBLIC_KEY_PATH_MISSING }
  ];
  it.each(requiredVars) ('Throws an error if $envName missing ', (missingVar)=> {
    delete process.env[missingVar.envName];
    expect(() => createJwtConfig()).toThrow(missingVar.errorMsg);
  });





  it ('Uses default value for expiration times if not provided', ()=> {
    delete process.env.EXPIRATION_TIME_ACCESS_TOKEN;
    delete process.env.EXPIRATION_TIME_REFRESH_TOKEN;

    const result : JwtConfigShape = createJwtConfig();

    expect(result.expirationAccessToken).toBe(900000);
    expect(result.expirationRefreshToken).toBe(604800000);
  });


  it ('Throws an error if expiration time format is invalid', ()=> {
    process.env.EXPIRATION_TIME_ACCESS_TOKEN  = '15x';

    expect(() => createJwtConfig()).toThrow(JwtSchemaErrorMessage.EXPIRATION_TIME_ACCESS_TOKEN_INVALID);
  });

  it ('Throws an error if expiration time format has too large value', ()=> {
    process.env.EXPIRATION_TIME_ACCESS_TOKEN  = '15000m';

    expect(() => createJwtConfig()).toThrow(JwtSchemaErrorMessage.EXPIRATION_TIME_ACCESS_TOKEN_INVALID);
  });

  it ('Throws an error if expiration time format has negative value', ()=> {
    process.env.EXPIRATION_TIME_ACCESS_TOKEN  = '-1h';

    expect(() => createJwtConfig()).toThrow(JwtSchemaErrorMessage.EXPIRATION_TIME_ACCESS_TOKEN_INVALID);
  });

  it ('Throws an error if expiration time format is missing unit', ()=> {
    process.env.EXPIRATION_TIME_ACCESS_TOKEN  = '20';

    expect(() => createJwtConfig()).toThrow(JwtSchemaErrorMessage.EXPIRATION_TIME_ACCESS_TOKEN_INVALID);
  });

  it ('Throws an error if expiration time unit is doubled', ()=> {
    process.env.EXPIRATION_TIME_ACCESS_TOKEN  = '10hh';

    expect(() => createJwtConfig()).toThrow(JwtSchemaErrorMessage.EXPIRATION_TIME_ACCESS_TOKEN_INVALID);
  });

  it ('Throws an error if expiration time format is empty string', ()=> {
    process.env.EXPIRATION_TIME_ACCESS_TOKEN  = '';

    expect(() => createJwtConfig()).toThrow(JwtSchemaErrorMessage.EXPIRATION_TIME_ACCESS_TOKEN_INVALID);
  });

  it ('Throws an error if expiration time format has zero value', ()=> {
    process.env.EXPIRATION_TIME_ACCESS_TOKEN  = '0h';

    expect(() => createJwtConfig()).toThrow(JwtSchemaErrorMessage.EXPIRATION_TIME_ACCESS_TOKEN_INVALID);
  });

  it ('Throws an error if expiration time format has non-numeric value', ()=> {
    process.env.EXPIRATION_TIME_ACCESS_TOKEN  = 'abc m';

    expect(() => createJwtConfig()).toThrow(JwtSchemaErrorMessage.EXPIRATION_TIME_ACCESS_TOKEN_INVALID);
  });

  it ('Throws an error if expiration time  starts from characters', ()=> {
    process.env.EXPIRATION_TIME_ACCESS_TOKEN = 'm15';

    expect(() => createJwtConfig()).toThrow(JwtSchemaErrorMessage.EXPIRATION_TIME_ACCESS_TOKEN_INVALID);
  });
  it ('Throws an error if expiration time format is invalid', ()=> {
    process.env.EXPIRATION_TIME_REFRESH_TOKEN  = 'seven days';

    expect(() => createJwtConfig()).toThrow(JwtSchemaErrorMessage.EXPIRATION_TIME_REFRESH_TOKEN_INVALID);
  });

  it ('Throws an error if key paths do not end with .pem', ()=> {
    process.env.JWT_PRIVATE_KEY_PATH = './keys/private.txt';

    expect(() => createJwtConfig()).toThrow(JwtSchemaErrorMessage.JWT_PRIVATE_KEY_PATH_INVALID);
  });

  it ('Throws an error if key paths are empty strings', ()=> {
    process.env.JWT_PUBLIC_KEY_PATH = '   ';

    expect(() => createJwtConfig()).toThrow(JwtSchemaErrorMessage.JWT_PUBLIC_KEY_PATH_INVALID);
  });

  it.each([
    { envVar: 'JWT_PRIVATE_KEY_PATH', value: 'hello.pem' },
    { envVar: 'JWT_PUBLIC_KEY_PATH', value: 'world.pem' }
  ])('Throws an error when $envVar = $value does not exist', ({ envVar , value } ) =>{
    process.env[envVar] = value;
    
    mockReadFile.mockImplementation(() => {
      throw new Error(`Error reading file at ${value}: Error: ENOENT: no such file or directory, open ${value}`);
    });
    
    expect(() => createJwtConfig()).toThrow(`Error reading file at ${value}: Error: ENOENT: no such file or directory, open ${value}`);
  });

  it ('Sets algorithm to RS256', ()=> {
    const result : JwtConfigShape = createJwtConfig();

    expect(result.algorithm).toBe('RS256');
  });
});