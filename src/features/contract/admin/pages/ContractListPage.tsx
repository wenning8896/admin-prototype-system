import { Button, Card, Drawer, Form, Input, List, Space, Table, Tag, Typography } from "antd";
import { useState } from "react";

const contractData = [
  { key: "CT-202603-01", name: "年度框架合同", status: "签署中", owner: "法务组", partner: "华东客户 A" },
  { key: "CT-202603-02", name: "联合促销协议", status: "待归档", owner: "渠道组", partner: "渠道伙伴 B" },
  { key: "CT-202603-03", name: "售后补充协议", status: "已完成", owner: "服务组", partner: "直营客户 C" },
];

export function ContractListPage() {
  const [open, setOpen] = useState(false);

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card page-card--hero">
        <Typography.Title level={3}>合同台账</Typography.Title>
        <Typography.Paragraph>
          这个页面加入了列表 + 侧滑详情的形态，适合展示中后台常见的“台账管理 + 快速查看”体验。
        </Typography.Paragraph>
      </Card>

      <Card
        className="page-card"
        title="合同列表"
        extra={
          <Space>
            <Button>批量归档</Button>
            <Button type="primary" onClick={() => setOpen(true)}>
              新建合同
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={contractData}
          columns={[
            { title: "合同编号", dataIndex: "key" },
            { title: "合同名称", dataIndex: "name" },
            { title: "合作方", dataIndex: "partner" },
            { title: "负责人", dataIndex: "owner" },
            {
              title: "状态",
              dataIndex: "status",
              render: (value: string) => {
                const colorMap: Record<string, string> = {
                  签署中: "processing",
                  待归档: "warning",
                  已完成: "success",
                };

                return <Tag color={colorMap[value]}>{value}</Tag>;
              },
            },
            {
              title: "操作",
              render: () => <Button type="link" onClick={() => setOpen(true)}>查看</Button>,
            },
          ]}
          pagination={false}
        />
      </Card>

      <Card className="page-card" title="法务提醒">
        <List
          dataSource={[
            "2 份合同签署超过 48 小时未回传。",
            "促销协议模板已升级到 V3，需要重新锁版。",
            "归档完成后需要同步门户权限。",
          ]}
          renderItem={(item) => <List.Item>{item}</List.Item>}
        />
      </Card>

      <Drawer title="合同详情 / 新建" open={open} onClose={() => setOpen(false)} width={480}>
        <Form layout="vertical">
          <Form.Item label="合同名称">
            <Input placeholder="请输入合同名称" />
          </Form.Item>
          <Form.Item label="合作方">
            <Input placeholder="请输入合作方" />
          </Form.Item>
          <Form.Item label="备注">
            <Input.TextArea rows={5} placeholder="请输入备注信息" />
          </Form.Item>
          <Button type="primary" block>
            保存草稿
          </Button>
        </Form>
      </Drawer>
    </Space>
  );
}

