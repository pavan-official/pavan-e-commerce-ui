// Client-safe authentication types (no server-side dependencies)
export interface CustomUser {
  id: string;
  email: string;
  name: string;
  role: string;
  image?: string;
}

export interface CustomSession {
  user: CustomUser;
  token: string;
  expires: string;
}
