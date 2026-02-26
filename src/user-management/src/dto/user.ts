import { ActivityStatus } from '../../generated/prisma/client.js';


//create user dtos
export interface CreateUserDto {
  email: string;
  name: string;
}
export interface CreatedUserDto {
  id: number;
}


//delete user dtos
export interface DeleteUserDto {
  id: number;
}


//update user dtos
export interface UpdateUserEmailDto {
  id: number;
  email: string;
}

export interface UpdateUserNameDto {
  id: number;
  name: string;
}

export interface UpdatedUserStatusDto {
  id: number;
  activity_status: ActivityStatus;
}

//find user dtos
export interface FindManyUserDto {
  activity_status?: ActivityStatus;
}
