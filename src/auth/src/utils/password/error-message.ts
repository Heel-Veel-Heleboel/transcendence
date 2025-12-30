import { PasswordError, PasswordErrorCode } from '../../constants/password.js';
import { PasswordPolicyConfigShape } from '../../types/password.js';


export function getPasswordErrorMessage(
  errorCode: PasswordErrorCode,
  policy: PasswordPolicyConfigShape
) : string {

  const messages: Record<PasswordErrorCode, string> = {
    [PasswordError.TOO_SHORT]: `Password must be at least ${policy.minLength} characters long.`,
    [PasswordError.TOO_LONG]: `Password must be at most ${policy.maxLength} characters long.`,
    [PasswordError.NO_UPPERCASE]: 'Password must have at least 1 uppercase letter.',
    [PasswordError.NO_LOWERCASE]: 'Password must have at least 1 lowercase letter.',
    [PasswordError.NO_NUMBER]: 'Password must have at least 1 number.',
    [PasswordError.NO_SPECIAL]: 'Password must have at least 1 special character.',
    [PasswordError.HAS_SPACE]: 'Password must not contain spaces.'
  };
  return(messages[errorCode]);
}