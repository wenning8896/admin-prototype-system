import {
  LockOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  Row,
  Segmented,
  Typography,
} from "antd";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { getDefaultPathForRole, roleMeta } from "../menu/resolver";
import type { RoleCode } from "../menu/types";

type LoginFormValues = {
  account: string;
  password: string;
  role: RoleCode;
  remember: boolean;
};

export function LoginPage() {
  const [form] = Form.useForm<LoginFormValues>();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const next = new URLSearchParams(location.search).get("next");
  const presetAccount = new URLSearchParams(location.search).get("account");
  const presetRole = new URLSearchParams(location.search).get("role") as RoleCode | null;

  if (isAuthenticated && user) {
    return <Navigate to={next ? decodeURIComponent(next) : getDefaultPathForRole(user.role)} replace />;
  }

  async function handleFinish(values: LoginFormValues) {
    setSubmitting(true);
    setError(null);

    try {
      const authUser = await login(values);
      navigate(next ? decodeURIComponent(next) : getDefaultPathForRole(authUser.role), {
        replace: true,
      });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "登录失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  function handleRoleChange(value: string | number) {
    const role = String(value) as RoleCode;
    form.setFieldsValue({
      role,
      account: role,
      password: "123456",
    });
  }

  return (
    <div className="login-page">
      <Row gutter={[24, 24]} className="login-page__grid">
        <Col xs={24} lg={13}>
          <div className="login-page__intro">
            <Typography.Text className="login-page__eyebrow">CSL Prototype Admin</Typography.Text>
            <Typography.Title className="login-page__title">CSL原型系统</Typography.Title>
            <Typography.Paragraph className="login-page__subtitle">
              面向管理端、经销商端、分销商端的统一原型工作台，覆盖订单、合同、门户等核心业务系统，用于功能演示、流程评审和导航验证。
            </Typography.Paragraph>
            <div className="login-page__visual">
              <div className="login-page__visual-badge">Unified Workspace</div>
              <div className="login-page__visual-grid">
                <div className="login-page__visual-card login-page__visual-card--primary">
                  <span className="login-page__visual-kicker">管理端</span>
                  <strong>订单 / 合同 / 门户</strong>
                </div>
                <div className="login-page__visual-card">
                  <span className="login-page__visual-kicker">经销商端</span>
                  <strong>下单、签收、财务</strong>
                </div>
                <div className="login-page__visual-card">
                  <span className="login-page__visual-kicker">分销商端</span>
                  <strong>E分销平台协同</strong>
                </div>
              </div>
            </div>
          </div>
        </Col>

        <Col xs={24} lg={11}>
          <Card className="login-card">
            <div className="login-card__header">
              <Typography.Text className="login-card__eyebrow">Sign in</Typography.Text>
              <Typography.Title level={3}>登录系统</Typography.Title>
              <Typography.Paragraph className="login-card__subtitle">
                请输入账号信息以继续访问系统。默认密码已预填为 <code>123456</code>。
              </Typography.Paragraph>
            </div>

            {error ? (
              <Alert
                type="error"
                showIcon
                message="登录失败"
                description={error}
                className="login-card__alert"
              />
            ) : null}

            <div className="login-card__helper">
              <Typography.Text type="secondary">角色切换后会自动更新默认账号。</Typography.Text>
            </div>

            <Form<LoginFormValues>
              form={form}
              layout="vertical"
              initialValues={{
                role: presetRole ?? "admin",
                account: presetAccount ?? "admin",
                password: "123456",
                remember: true,
              }}
              onFinish={handleFinish}
              className="login-card__form"
            >
              <Form.Item<LoginFormValues> label="登录角色" name="role">
                <Segmented
                  block
                  options={Object.values(roleMeta).map((item) => ({
                    label: item.label,
                    value: item.code,
                  }))}
                  onChange={handleRoleChange}
                />
              </Form.Item>

              <Form.Item<LoginFormValues>
                label="账号"
                name="account"
                rules={[{ required: true, message: "请输入账号" }]}
              >
                <Input prefix={<UserOutlined />} size="large" />
              </Form.Item>

              <Form.Item<LoginFormValues>
                label="密码"
                name="password"
                rules={[{ required: true, message: "请输入密码" }]}
              >
                <Input.Password prefix={<LockOutlined />} size="large" />
              </Form.Item>

              <Form.Item<LoginFormValues> name="remember" valuePropName="checked">
                <Checkbox>记住登录状态</Checkbox>
              </Form.Item>

              <Button htmlType="submit" type="primary" size="large" block loading={submitting}>
                登录并进入系统
              </Button>
            </Form>

            <div className="login-card__footer">
              <Typography.Text type="secondary">还没有账号？</Typography.Text>
              <Link to="/register">去注册</Link>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
