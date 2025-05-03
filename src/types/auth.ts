export type User = {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  language: 'EN' | 'PL' | 'ES' | 'UZ' | 'KA';
  theme: 'LIGHT' | 'DARK';
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type LoginResponse = {
  user: User;
  tokens: AuthTokens;
};

export type RegisterInput = {
  email: string;
  password: string;
  name: string;
};

export type LoginInput = {
  email: string;
  password: string;
};
export type JwtPayload = {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  language: 'EN' | 'PL' | 'ES' | 'UZ' | 'KA';
  theme: 'LIGHT' | 'DARK';
};