import { ArrowRightOutlined } from "@ant-design/icons";
import { Button, Card, Col, Row, Space, Tag, Typography } from "antd";
import { Link } from "react-router-dom";
import { getFirstLeafModuleId, roleMeta, systemMeta } from "../menu/resolver";
import { adminOrderMenu } from "../menu/pc/admin/order";

const roleCards = [
  {
    title: roleMeta.admin.label,
    code: roleMeta.admin.code,
    description: roleMeta.admin.description,
    metrics: ["全局菜单", "审批闭环", "配置入口"],
  },
  {
    title: roleMeta.dealer.label,
    code: roleMeta.dealer.code,
    description: roleMeta.dealer.description,
    metrics: ["我的业务", "签署进度", "消息通知"],
  },
  {
    title: roleMeta.distributor.label,
    code: roleMeta.distributor.code,
    description: roleMeta.distributor.description,
    metrics: ["渠道协同", "审批追踪", "门户配置"],
  },
];

const firstAdminOrderModule = getFirstLeafModuleId(adminOrderMenu) ?? "order-list";

export function LandingPage() {
  return (
    <div className="landing-page">
      <section className="landing-page__hero">
        <Tag color="blue">Vite + React 19 + TypeScript + Ant Design 6</Tag>
        <Typography.Title className="landing-page__title">
          中后台原型系统
        </Typography.Title>
        <Typography.Paragraph className="landing-page__subtitle">
          先把角色、系统、页面接入规范搭稳，再让菜单和功能持续扩。这里已经把
          `AppShell`、菜单解析、路由和页面注册都串起来了。
        </Typography.Paragraph>

        <Space wrap>
          <Link to="/login">
            <Button size="large">进入登录页</Button>
          </Link>
          <Link to={`/admin/order/${firstAdminOrderModule}`}>
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              iconPosition="end"
            >
              直接查看管理员订单系统
            </Button>
          </Link>
          <Link to="/admin/contract/contract-list">
            <Button size="large">查看合同示例</Button>
          </Link>
        </Space>
      </section>

      <section className="landing-page__section">
        <Typography.Title level={4}>结构原则</Typography.Title>
        <Row gutter={[16, 16]}>
          {Object.values(systemMeta).map((system) => (
            <Col xs={24} md={8} key={system.code}>
              <Card className="landing-page__card">
                <Typography.Title level={5}>{system.label}</Typography.Title>
                <Typography.Paragraph>{system.description}</Typography.Paragraph>
                <Tag bordered={false}>{system.code}</Tag>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      <section className="landing-page__section">
        <Typography.Title level={4}>角色入口</Typography.Title>
        <Row gutter={[16, 16]}>
          {roleCards.map((card) => (
            <Col xs={24} md={8} key={card.code}>
              <Card className="landing-page__card">
                <Typography.Title level={5}>{card.title}</Typography.Title>
                <Typography.Paragraph>{card.description}</Typography.Paragraph>
                <Space wrap>
                  {card.metrics.map((item) => (
                    <Tag key={item}>{item}</Tag>
                  ))}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </section>
    </div>
  );
}
