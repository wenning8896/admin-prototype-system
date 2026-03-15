import {
  LockOutlined,
  MailOutlined,
  MobileOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { Alert, Button, Card, Checkbox, Col, Form, Input, Row, Segmented, Space, Typography } from "antd";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { getDefaultPathForRole, roleMeta } from "../menu/resolver";
import type { RoleCode } from "../menu/types";

type RegisterFormValues = {
  role: Extract<RoleCode, "dealer" | "distributor">;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  smsCode: string;
  agreement: boolean;
};

export function RegisterPage() {
  const [form] = Form.useForm<RegisterFormValues>();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [codeSending, setCodeSending] = useState(false);
  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated && user) {
    return <Navigate to={getDefaultPathForRole(user.role)} replace />;
  }

  async function handleFinish(values: RegisterFormValues) {
    setSubmitting(true);
    setError(null);

    try {
      const nextUser = await register({
        role: values.role,
        phone: values.phone,
        email: values.email,
        password: values.password,
      });
      navigate(
        `/register/certification?account=${encodeURIComponent(nextUser.account)}&role=${encodeURIComponent(nextUser.role)}`,
        {
          replace: true,
          state: {
            account: nextUser.account,
            role: nextUser.role,
            email: values.email,
          },
        },
      );
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : "注册失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMockSmsSend() {
    setCodeSending(true);
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    setCodeSending(false);
    form.setFieldValue("smsCode", "888888");
  }

  return (
    <div className="login-page">
      <Row gutter={[24, 24]} className="login-page__grid">
        <Col xs={24} lg={13}>
          <div className="login-page__intro">
            <Typography.Text className="login-page__eyebrow">Create CSL Account</Typography.Text>
            <Typography.Title className="login-page__title">创建 CSL 原型账号</Typography.Title>
            <Typography.Paragraph className="login-page__subtitle">
              为不同角色创建原型访问账号，注册完成后即可进入对应工作台继续演示业务流程。
            </Typography.Paragraph>
            <div className="login-page__visual">
              <div className="login-page__visual-badge">Account Provisioning</div>
              <div className="login-page__visual-grid">
                <div className="login-page__visual-card login-page__visual-card--primary">
                  <span className="login-page__visual-kicker">注册资料</span>
                  <strong>角色、手机号、邮箱、密码、验证码</strong>
                </div>
                <div className="login-page__visual-card">
                  <span className="login-page__visual-kicker">可注册角色</span>
                  <strong>经销商 / 分销商</strong>
                </div>
              </div>
            </div>
          </div>
        </Col>

        <Col xs={24} lg={11}>
          <Card className="login-card">
            <div className="login-card__header">
              <Typography.Text className="login-card__eyebrow">Register</Typography.Text>
              <Typography.Title level={3}>注册账号</Typography.Title>
              <Typography.Paragraph className="login-card__subtitle">
                填写基础信息后即可生成原型访问账号，注册成功后将进入腾讯电子签认证流程。
              </Typography.Paragraph>
            </div>

            {error ? (
              <Alert
                type="error"
                showIcon
                message="注册失败"
                description={error}
                className="login-card__alert"
              />
            ) : null}

            <div className="login-card__helper">
              <Space direction="vertical" size={2}>
                <Typography.Text type="secondary">短信验证码为原型校验，演示码可自动填入。</Typography.Text>
                <Typography.Text type="secondary">注册完成后请使用手机号作为登录账号。</Typography.Text>
              </Space>
            </div>

            <Form<RegisterFormValues>
              form={form}
              layout="vertical"
              initialValues={{
                role: "dealer",
                password: "123456",
                confirmPassword: "123456",
                agreement: false,
              }}
              onFinish={handleFinish}
              className="login-card__form"
            >
              <Form.Item<RegisterFormValues> label="角色" name="role">
                <Segmented
                  block
                  options={Object.values(roleMeta)
                    .filter((item) => item.code !== "admin")
                    .map((item) => ({
                    label: item.label,
                    value: item.code,
                  }))}
                />
              </Form.Item>

              <Form.Item<RegisterFormValues>
                label="手机号码"
                name="phone"
                rules={[
                  { required: true, message: "请输入手机号码" },
                  { pattern: /^1\d{10}$/, message: "请输入正确的手机号码" },
                ]}
              >
                <Input prefix={<MobileOutlined />} size="large" placeholder="请输入手机号码" />
              </Form.Item>

              <Form.Item<RegisterFormValues>
                label="电子邮箱"
                name="email"
                rules={[
                  { required: true, message: "请输入电子邮箱" },
                  { type: "email", message: "请输入正确的邮箱格式" },
                ]}
              >
                <Input prefix={<MailOutlined />} size="large" placeholder="请输入电子邮箱" />
              </Form.Item>

              <Form.Item<RegisterFormValues>
                label="密码"
                name="password"
                rules={[
                  { required: true, message: "请输入密码" },
                  { min: 6, message: "密码至少 6 位" },
                ]}
              >
                <Input.Password prefix={<LockOutlined />} size="large" placeholder="请输入密码" />
              </Form.Item>

              <Form.Item<RegisterFormValues>
                label="确认密码"
                name="confirmPassword"
                dependencies={["password"]}
                rules={[
                  { required: true, message: "请再次输入密码" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }

                      return Promise.reject(new Error("两次输入的密码不一致"));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} size="large" placeholder="请再次输入密码" />
              </Form.Item>

              <Form.Item<RegisterFormValues>
                label="短信验证码"
                name="smsCode"
                rules={[
                  { required: true, message: "请输入短信验证码" },
                  {
                    validator(_, value) {
                      if (!value || value === "888888") {
                        return Promise.resolve();
                      }

                      return Promise.reject(new Error("短信验证码错误，请输入 888888"));
                    },
                  },
                ]}
              >
                <Input
                  prefix={<SafetyCertificateOutlined />}
                  size="large"
                  placeholder="请输入短信验证码"
                  addonAfter={
                    <Button type="link" onClick={() => void handleMockSmsSend()} loading={codeSending}>
                      获取验证码
                    </Button>
                  }
                />
              </Form.Item>

              <Form.Item<RegisterFormValues>
                name="agreement"
                valuePropName="checked"
                rules={[
                  {
                    validator(_, value) {
                      if (value) {
                        return Promise.resolve();
                      }

                      return Promise.reject(new Error("请先阅读并勾选用户协议"));
                    },
                  },
                ]}
              >
                <Checkbox>
                  我已阅读并同意
                  <a href="#" onClick={(event) => event.preventDefault()}>
                    《用户协议》
                  </a>
                </Checkbox>
              </Form.Item>

              <Button htmlType="submit" type="primary" size="large" block loading={submitting}>
                注册并去认证
              </Button>
            </Form>

            <div className="login-card__footer">
              <Typography.Text type="secondary">已有账号？</Typography.Text>
              <Link to="/login">返回登录</Link>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
