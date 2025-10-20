import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    admin?: {
      id: string;
      email: string;
      role: string;
    };
  }
}
