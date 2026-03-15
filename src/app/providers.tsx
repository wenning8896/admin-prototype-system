import type { PropsWithChildren } from "react";
import { App, ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import { AuthProvider } from "../auth/AuthContext";

dayjs.locale("zh-cn");

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: "#1456f0",
          colorBgContainer: "#ffffff",
          borderRadius: 14,
          fontSize: 14,
          fontFamily:
            '"IBM Plex Sans", "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", sans-serif',
        },
      }}
    >
      <App>
        <AuthProvider>{children}</AuthProvider>
      </App>
    </ConfigProvider>
  );
}
