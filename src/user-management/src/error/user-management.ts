export class UserNotFoundError extends Error {
  constructor() {
    super();
    this.name = 'UserNotFoundError';
  }
}

export class InvalidUpdateError extends Error {
  constructor() {
    super();
    this.name = 'InvalidUpdateError';
  }
}

export class UserAlreadyExistsError extends Error {
  constructor(public unique_field: 'email' | 'name') {
    super();
    this.name = 'UserAlreadyExistsError';
  }
}

export class DatabaseError extends Error {
  constructor(msg?: string) {
    super(msg);
    this.name = 'DatabaseError';
  }
}


export class ProfileNotFoundError extends Error {
  constructor() {
    super();
    this.name = 'ProfileNotFoundError';
  }
}