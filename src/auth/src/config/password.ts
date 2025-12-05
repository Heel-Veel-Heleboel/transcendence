export const PasswordPolicy = {
  minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
  maxLength: parseInt(process.env.PASSWORD_MAX_LENGTH || '30', 10),
  requiredUppercase: true,
  requiredLowercase: true,
  requiredNumber: true,
  requiredSpecialChar: true,
  allowSpaces: false
};