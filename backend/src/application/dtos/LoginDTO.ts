export interface LoginInputDTO {
  email: string;
  password: string;
}

export interface LoginOutputDTO {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  };
}
