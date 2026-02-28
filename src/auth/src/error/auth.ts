/**
 * Thrown when authentication fails due to invalid credentials,
 * invalid tokens, or other authentication-related issues.
 * Example: Wrong password, invalid token format, expired token.
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Thrown when a user attempts to access a resource or perform
 * an action they are not authorized for.
 * Example: Token does not belong to user, insufficient permissions.
 */
export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Thrown when a requested resource cannot be found.
 * Example: User not found by ID or email, credentials not found.
 */
export class ResourceNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResourceNotFoundError';
  }
}


/**
 * Thown when an attempt is made to create a resource that already exists.
 * Example: Attempting to register with an email that is already in use.
 */
export class ResourceConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResourceConflictError';
  }
}