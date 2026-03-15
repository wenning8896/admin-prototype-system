import { createContext } from "react";
import type { RoleCode } from "../menu/types";

export type AuthUser = {
  id: string;
  name: string;
  role: RoleCode;
  account: string;
};

export type LoginPayload = {
  account: string;
  password: string;
  role: RoleCode;
  remember: boolean;
};

export type RegisterPayload = {
  role: Extract<RoleCode, "dealer" | "distributor">;
  phone: string;
  email: string;
  password: string;
};

export type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isBootstrapped: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
