
import { getEnvSaltRounds }from './config/security.js';

import { SaltLimits } from './constants/password.js';



try {
  console.log(getEnvSaltRounds(SaltLimits));
}catch (error) {
  console.error('Password policy validation failed during initialization:', error);
  process.exit(1);
}
