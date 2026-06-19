
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      type: string;
      entreprise: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    type: string;
    entreprise: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    type: string;
    entreprise: string;
    id: string;
  }
}