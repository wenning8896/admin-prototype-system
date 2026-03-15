import type { PropsWithChildren } from "react";
import { useMemo, useState } from "react";
import type { RoleCode } from "../menu/types";
import {
  AuthContext,
  type AuthContextValue,
  type AuthUser,
  type RegisterPayload,
} from "./auth-context";

const AUTH_STORAGE_KEY = "admin-prototype-auth";
const AUTH_USERS_STORAGE_KEY = "admin-prototype-users";
const DEFAULT_PASSWORD = "123456";

const demoUsers: Record<
  RoleCode,
  { account: string; password: string; name: string; phone: string; email: string }
> = {
  admin: {
    account: "admin",
    password: DEFAULT_PASSWORD,
    name: "周睿",
    phone: "13800000001",
    email: "admin@csl-prototype.local",
  },
  dealer: {
    account: "dealer",
    password: DEFAULT_PASSWORD,
    name: "徐衡",
    phone: "13800000002",
    email: "dealer@csl-prototype.local",
  },
  distributor: {
    account: "distributor",
    password: DEFAULT_PASSWORD,
    name: "林舟",
    phone: "13800000003",
    email: "distributor@csl-prototype.local",
  },
};

type StoredAuthUser = AuthUser & {
  password: string;
  phone: string;
  email: string;
};

function readStoredUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function getSeedUsers(): StoredAuthUser[] {
  return Object.entries(demoUsers).map(([role, item], index) => ({
    id: `${role}-${index + 1}`,
    role: role as RoleCode,
    account: item.account,
    name: item.name,
    password: item.password,
    phone: item.phone,
    email: item.email,
  }));
}

function readStoredUsers() {
  if (typeof window === "undefined") {
    return getSeedUsers();
  }

  const raw = window.localStorage.getItem(AUTH_USERS_STORAGE_KEY);

  if (!raw) {
    return getSeedUsers();
  }

  try {
    const users = JSON.parse(raw) as StoredAuthUser[];
    return users.length ? users : getSeedUsers();
  } catch {
    window.localStorage.removeItem(AUTH_USERS_STORAGE_KEY);
    return getSeedUsers();
  }
}

function persistUsers(users: StoredAuthUser[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(users));
}

function toAuthUser(user: StoredAuthUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    account: user.account,
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [users, setUsers] = useState<StoredAuthUser[]>(() => readStoredUsers());

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isBootstrapped: true,
      async login(payload) {
        const matched = users.find(
          (item) => item.account === payload.account && item.role === payload.role,
        );

        if (!matched) {
          throw new Error("账号不存在，请先注册或检查登录角色。");
        }

        if (payload.password !== matched.password) {
          throw new Error("密码错误，请输入统一密码 123456。");
        }

        const nextUser = toAuthUser(matched);

        setUser(nextUser);

        if (payload.remember) {
          window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
        } else {
          window.localStorage.removeItem(AUTH_STORAGE_KEY);
        }

        return nextUser;
      },
      async register(payload: RegisterPayload) {
        const existed = users.find(
          (item) => item.account === payload.phone && item.role === payload.role,
        );

        if (existed) {
          throw new Error("该手机号在当前角色下已注册，请直接登录。");
        }

        const roleNameMap: Record<RegisterPayload["role"], string> = {
          dealer: "经销商用户",
          distributor: "分销商用户",
        };

        const nextStoredUser: StoredAuthUser = {
          id: `${payload.role}-${Date.now()}`,
          role: payload.role,
          account: payload.phone,
          name: `${roleNameMap[payload.role]}-${payload.phone.slice(-4)}`,
          password: payload.password,
          phone: payload.phone,
          email: payload.email,
        };

        const nextUsers = [...users, nextStoredUser];
        setUsers(nextUsers);
        persistUsers(nextUsers);

        return toAuthUser(nextStoredUser);
      },
      logout() {
        setUser(null);
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      },
    }),
    [user, users],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
