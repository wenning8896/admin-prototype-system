import {
  AppstoreOutlined,
  BuildOutlined,
  ClusterOutlined,
  DashboardOutlined,
  DeploymentUnitOutlined,
  ExpandOutlined,
  ExportOutlined,
  FileSearchOutlined,
  FolderOpenOutlined,
  FullscreenExitOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  SunOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Breadcrumb, Button, Drawer, Dropdown, Layout, Menu, Segmented, Space, Tag, Typography } from "antd";
import type { MenuProps } from "antd";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import {
  findMenuNode,
  getFirstLeafModuleId,
  getMenuForRoute,
  roleMeta,
  systemMeta,
} from "../menu/resolver";
import type { MenuNode, RoleCode, SystemCode } from "../menu/types";
import { NotFoundPage } from "../pages/NotFoundPage";

const { Header, Sider, Content } = Layout;

function getMenuIcon(node: MenuNode, level: number): ReactNode {
  if (level > 2) {
    return null;
  }

  if (level === 1) {
    if (node.id.includes("dashboard")) return <DashboardOutlined />;
    if (node.id.includes("management")) return <AppstoreOutlined />;
    if (node.id.includes("approval")) return <SafetyCertificateOutlined />;
    if (node.id.includes("config")) return <SettingOutlined />;
    if (node.id.includes("operations")) return <ClusterOutlined />;
    return <FolderOpenOutlined />;
  }

  if (node.kind === "dashboard") return <DashboardOutlined />;
  if (node.kind === "approval") return <SafetyCertificateOutlined />;
  if (node.kind === "schema") return <SettingOutlined />;
  if (node.id.includes("risk")) return <SafetyCertificateOutlined />;
  if (node.id.includes("template")) return <BuildOutlined />;
  if (node.id.includes("banner") || node.id.includes("card") || node.id.includes("notice")) {
    return <ClusterOutlined />;
  }
  return <FileSearchOutlined />;
}

function renderMenuLabel(node: MenuNode, level: number, hasChildren: boolean) {
  const icon = getMenuIcon(node, level);

  return (
    <span
      className={[
        "app-shell__menu-label",
        `app-shell__menu-label--level-${Math.min(level, 4)}`,
        hasChildren ? "app-shell__menu-label--branch" : "app-shell__menu-label--leaf",
      ].join(" ")}
      title={node.label}
    >
      {icon ? <span className="app-shell__menu-icon">{icon}</span> : null}
      {node.label}
    </span>
  );
}

function toMenuItems(nodes: MenuNode[], level = 1): MenuProps["items"] {
  return nodes.map((node) => {
    if (node.children?.length) {
      return {
        key: node.id,
        label: renderMenuLabel(node, level, true),
        children: toMenuItems(node.children, level + 1),
      };
    }

    return {
      key: node.id,
      label: renderMenuLabel(node, level, false),
    };
  });
}

function getAllBranchKeys(nodes: MenuNode[]): string[] {
  return nodes.flatMap((node) => {
    if (!node.children?.length) {
      return [];
    }

    return [node.id, ...getAllBranchKeys(node.children)];
  });
}

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem("csl-theme") === "dark";
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { role, system, moduleId } = useParams();
  const menu = getMenuForRoute(role, system);
  const menuScopeKey = `${role ?? ""}-${system ?? ""}`;

  const activeNode = useMemo(
    () => (menu && moduleId ? findMenuNode(menu, moduleId) : undefined),
    [menu, moduleId],
  );
  useEffect(() => {
    document.documentElement.dataset.theme = isDarkMode ? "dark" : "light";
    window.localStorage.setItem("csl-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  if (!role || !system || !menu) {
    return <NotFoundPage compact />;
  }

  const currentRole = roleMeta[role as RoleCode];
  const currentSystem = systemMeta[system as SystemCode];

  if (!currentRole || !currentSystem) {
    return <NotFoundPage compact />;
  }

  const onRoleChange = (nextRole: string | number) => {
    const nextMenu = getMenuForRoute(String(nextRole), system);
    const nextModuleId = nextMenu ? getFirstLeafModuleId(nextMenu) : undefined;

    if (nextModuleId) {
      navigate(`/${nextRole}/${system}/${nextModuleId}`);
    }
  };

  const onSystemChange = (nextSystem: string | number) => {
    const nextMenu = getMenuForRoute(role, String(nextSystem));
    const nextModuleId = nextMenu ? getFirstLeafModuleId(nextMenu) : undefined;

    if (nextModuleId) {
      navigate(`/${role}/${nextSystem}/${nextModuleId}`);
    }
  };

  const onMenuSelect: MenuProps["onClick"] = ({ key }) => {
    navigate(`/${role}/${system}/${key}`);
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "account",
      label: (
        <div className="app-shell__account-menu">
          <Typography.Text strong>{user?.name ?? "演示用户"}</Typography.Text>
          <Typography.Text type="secondary">{user?.account}</Typography.Text>
        </div>
      ),
      disabled: true,
    },
    {
      key: "switch",
      label: "返回欢迎页",
      onClick: () => navigate("/welcome"),
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出登录",
      onClick: () => {
        logout();
        navigate("/login", { replace: true });
      },
    },
  ];

  const exportTasks = [
    { id: "EXP-202603-01", name: "订单列表导出", status: "处理中", time: "刚刚" },
    { id: "EXP-202603-02", name: "合同台账导出", status: "已完成", time: "5 分钟前" },
    { id: "EXP-202603-03", name: "门户配置快照", status: "已完成", time: "12 分钟前" },
  ];

  async function handleFullscreenToggle() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await document.documentElement.requestFullscreen();
  }

  return (
    <Layout className="app-shell">
      <Sider
        breakpoint="lg"
        width={268}
        collapsed={collapsed}
        collapsedWidth={92}
        className="app-shell__sider"
        theme="light"
      >
        <div className="app-shell__brand">
          <div className="app-shell__brand-mark">
            <DeploymentUnitOutlined />
          </div>
          {!collapsed && (
            <div className="app-shell__brand-copy">
              <div className="app-shell__brand-title">CSL原型系统</div>
              <div className="app-shell__brand-subtitle">Prototype Admin Workspace</div>
            </div>
          )}
        </div>

        <div className="app-shell__menu-wrap">
          <Menu
            key={menuScopeKey}
            mode="inline"
            selectedKeys={moduleId ? [moduleId] : []}
            defaultOpenKeys={collapsed ? [] : getAllBranchKeys(menu)}
            items={toMenuItems(menu)}
            onClick={onMenuSelect}
            className="app-shell__menu"
          />
        </div>
      </Sider>

      <Layout>
        <Header className="app-shell__header">
          <div className="app-shell__header-main">
            <Space size={12} className="app-shell__header-left">
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed((value) => !value)}
              />
              <div>
                <Breadcrumb
                  items={[
                    {
                      title: <Link to="/welcome">首页</Link>,
                    },
                    {
                      title: currentRole.label,
                    },
                    {
                      title: currentSystem.label,
                    },
                    ...(activeNode
                      ? [
                          {
                            title: activeNode.label,
                          },
                        ]
                      : []),
                  ]}
                />
              </div>
            </Space>

            <Space wrap size={12} className="app-shell__header-tools">
              <div className="app-shell__switchers">
                <Segmented
                  value={role}
                  options={Object.values(roleMeta).map((item) => ({
                    label: item.label,
                    value: item.code,
                  }))}
                  onChange={onRoleChange}
                />
                <Segmented
                  value={system}
                  options={Object.values(systemMeta).map((item) => ({
                    label: item.label,
                    value: item.code,
                  }))}
                  onChange={onSystemChange}
                />
              </div>
              <Button
                className="app-shell__icon-button"
                icon={<ExportOutlined />}
                onClick={() => setIsTaskDrawerOpen(true)}
                aria-label="查看导出任务"
                title="查看导出任务"
              />
              <Button
                className="app-shell__icon-button"
                icon={isFullscreen ? <FullscreenExitOutlined /> : <ExpandOutlined />}
                onClick={() => void handleFullscreenToggle()}
                aria-label={isFullscreen ? "退出全屏" : "全屏模式"}
                title={isFullscreen ? "退出全屏" : "全屏模式"}
              />
              <Button
                className="app-shell__icon-button"
                icon={isDarkMode ? <MoonOutlined /> : <SunOutlined />}
                onClick={() => setIsDarkMode((value) => !value)}
                aria-label={isDarkMode ? "切换浅色模式" : "切换深色模式"}
                title={isDarkMode ? "切换浅色模式" : "切换深色模式"}
              />
              <Dropdown menu={{ items: userMenuItems }} trigger={["click"]}>
                <Button className="app-shell__account-trigger">
                  <Space>
                    <Avatar size="small" icon={<UserOutlined />} />
                    {user?.name ?? "演示用户"}
                  </Space>
                </Button>
              </Dropdown>
            </Space>
          </div>
        </Header>

        <Content className="app-shell__content" key={location.pathname}>
          <Outlet />
        </Content>
      </Layout>

      <Drawer
        title="导出任务"
        open={isTaskDrawerOpen}
        onClose={() => setIsTaskDrawerOpen(false)}
        width={420}
      >
        <Space direction="vertical" size={12} className="page-stack">
          {exportTasks.map((task) => (
            <div key={task.id} className="app-shell__task-card">
              <div className="app-shell__task-head">
                <Typography.Text strong>{task.name}</Typography.Text>
                <Tag color={task.status === "已完成" ? "success" : "processing"}>{task.status}</Tag>
              </div>
              <Typography.Text type="secondary">{task.id}</Typography.Text>
              <Typography.Paragraph className="app-shell__task-time">
                更新时间：{task.time}
              </Typography.Paragraph>
            </div>
          ))}
        </Space>
      </Drawer>
    </Layout>
  );
}
