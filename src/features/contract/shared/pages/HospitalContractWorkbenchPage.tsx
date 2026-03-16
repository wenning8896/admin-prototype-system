import { Card, Col, Row, Space, Table, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import type { HospitalContractRecord } from "../mocks/hospitalContract.mock";
import { getContractStatistics, listHospitalContracts } from "../services/hospitalContract.mock-service";

type Props = {
  roleLabel: string;
};

export function HospitalContractWorkbenchPage({ roleLabel }: Props) {
  const [items, setItems] = useState<HospitalContractRecord[]>([]);

  useEffect(() => {
    void (async () => {
      setItems(await listHospitalContracts());
    })();
  }, []);

  const stats = getContractStatistics(items);

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card">
        <Typography.Title level={4} style={{ margin: 0 }}>
          {roleLabel}合同工作台
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
          这里承接院采合同的总体情况、待办合同以及近期流转状态，作为合同系统首页入口。
        </Typography.Paragraph>
      </Card>

      <Row gutter={16}>
        {[
          { label: "合同总数", value: stats.total },
          { label: "审核中", value: stats.pending },
          { label: "有效合同", value: stats.active },
          { label: "已关闭", value: stats.invalid },
        ].map((item) => (
          <Col key={item.label} span={6}>
            <Card className="page-card">
              <Typography.Text type="secondary">{item.label}</Typography.Text>
              <Typography.Title level={2} style={{ marginTop: 12, marginBottom: 0 }}>
                {item.value}
              </Typography.Title>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="page-card" title="近期合同流转">
        <Table
          rowKey="id"
          dataSource={items.slice(0, 5)}
          pagination={false}
          columns={[
            { title: "合同编号", dataIndex: "contractNo", width: 180 },
            { title: "经销商名称", dataIndex: "dealerName", width: 220 },
            { title: "医院名称", dataIndex: "dmsHospitalName", width: 220 },
            { title: "合同存续状态", dataIndex: "lifeStatus", width: 120, render: (value: string) => <Tag color={value === "有效" ? "success" : "default"}>{value}</Tag> },
            { title: "更新时间", dataIndex: "updatedAt", width: 180 },
          ]}
          scroll={{ x: 980 }}
        />
      </Card>
    </Space>
  );
}
