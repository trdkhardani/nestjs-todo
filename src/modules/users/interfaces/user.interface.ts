export interface UserInfoInput {
  userId: string;
}

export interface UpdateUserInput {
  userId: string;
  username: string;
  name: string;
}

export interface ChangePasswordInput {
  userId: string;
  oldPassword: string;
  newPassword: string;
}

export interface DeleteUserInput {
  userId: string;
}
