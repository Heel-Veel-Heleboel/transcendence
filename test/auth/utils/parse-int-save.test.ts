import { describe, it , expect } from 'vitest';
import { PasswordLimitsConfigShape } from '../../../src/auth/src/types/password';
import { parseIntSave } from '../../../src/auth/src/utils/parse-int-save';



describe('Save int cast testing', () => {


  const PasswordPolicyLimits : PasswordLimitsConfigShape = {
    MIN_LENGTH_LOWER_BOUND: 1,
    MIN_LENGTH_UPPER_BOUND: 64,
    MAX_LENGTH_LOWER_BOUND: 8,
    MAX_LENGTH_UPPER_BOUND: 128,
    DEFAULT_MIN_LENGTH: 8,
    DEFAULT_MAX_LENGTH: 30
  };
  it ('Should return two NaN if both inputs are invalid', () => {
    const resultMin = parseIntSave('invalid', PasswordPolicyLimits.DEFAULT_MIN_LENGTH);
    const resultMax = parseIntSave('invalid', PasswordPolicyLimits.DEFAULT_MAX_LENGTH);
    expect(resultMin).toBe(NaN);
    expect(resultMax).toBe(NaN);
  } );

  it ('Should return default min length if input is empty string', () => {
    const resultMin = parseIntSave('', PasswordPolicyLimits.DEFAULT_MIN_LENGTH);
    expect(resultMin).toBe(PasswordPolicyLimits.DEFAULT_MIN_LENGTH);
  } );

  it ('Should return default max length if input is undefined', () => {
    const resultMax = parseIntSave(undefined, PasswordPolicyLimits.DEFAULT_MAX_LENGTH);
    expect(resultMax).toBe(PasswordPolicyLimits.DEFAULT_MAX_LENGTH);
  });

  it ('Should parse valid integer strings correctly', () => {
    const resultMin = parseIntSave('12', PasswordPolicyLimits.DEFAULT_MIN_LENGTH);
    const resultMax = parseIntSave('64', PasswordPolicyLimits.DEFAULT_MAX_LENGTH);
    expect(resultMin).toBe(12);
    expect(resultMax).toBe(64);
  });

  it('Should return NaN if input is float string', () => {
    const resultMin = parseIntSave('12.34', PasswordPolicyLimits.DEFAULT_MIN_LENGTH);
    expect(resultMin).toBe(NaN);
  });

  it ('Should return NaN if input starts with number and has characters after', () => {
    const resultMax = parseIntSave('56abc', PasswordPolicyLimits.DEFAULT_MAX_LENGTH);
    expect(resultMax).toBe(NaN);
  });
});