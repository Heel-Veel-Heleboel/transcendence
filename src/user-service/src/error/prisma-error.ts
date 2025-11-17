import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';


export class DuplicateEntryError extends Error {
  public field: string;

  constructor(field: string) {
    //console.log('Creating DuplicateEntryError for field:', field);
    super(`${field} already exists.`);
    this.field = field;
    this.name = 'DuplicateEntryError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string = 'A database error occurred.') {
    super(message);
    this.name = 'DatabaseError';
  }
}


export function isPrismaKnownError(error: unknown): error is PrismaClientKnownRequestError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    'clientVersion' in error &&
    'meta' in error
  );
}
