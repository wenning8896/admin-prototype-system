import { Card, Col, DatePicker, Form, Input, Row, Space, Table, Typography } from "antd";
import { useMemo } from "react";
import { FilterPanel } from "../../../../app/components/FilterPanel";

const regionRows = [
  { id: "region-1", region: "华东大区", shouldCount: 42, submittedCount: 38, approvedCount: 35, rate: "83.3%" },
  { id: "region-2", region: "华北大区", shouldCount: 30, submittedCount: 26, approvedCount: 24, rate: "80.0%" },
];

const dealerRows = [
  { id: "dealer-1", dealerCode: "D1917070", dealerName: "辽宁嘉丰进出口贸易有限公司", shouldCount: 18, submittedCount: 16, approvedCount: 15, rate: "83.3%" },
  { id: "dealer-2", dealerCode: "D5060011", dealerName: "广州市康盈贸易有限公司", shouldCount: 12, submittedCount: 10, approvedCount: 9, rate: "75.0%" },
];

export function SignReceiptStatisticsPage() {
  const summary = useMemo(
    () => ({
      shouldCount: regionRows.reduce((sum, item) => sum + item.shouldCount, 0),
      submittedCount: regionRows.reduce((sum, item) => sum + item.submittedCount, 0),
      approvedCount: regionRows.reduce((sum, item) => sum + item.approvedCount, 0),
      rate: "82.0%",
    }),
    [],
  );

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card" title="筛选条件">
        <Form layout="vertical">
          <FilterPanel
            fields={[
              <Form.Item key="dealerName" name="dealerName" label="经销商名称">
                <Input allowClear placeholder="请输入经销商名称" />
              </Form.Item>,
              <Form.Item key="region" name="region" label="大区">
                <Input allowClear placeholder="请输入大区" />
              </Form.Item>,
              <Form.Item key="dateRange" name="dateRange" label="日期区间">
                <DatePicker.RangePicker style={{ width: "100%" }} />
              </Form.Item>,
            ]}
            actions={<></>}
          />
        </Form>
      </Card>

      <Row gutter={16}>
        {[
          { label: "应签收条数", value: summary.shouldCount },
          { label: "实际提交条数", value: summary.submittedCount },
          { label: "审核通过条数", value: summary.approvedCount },
          { label: "签收率", value: summary.rate },
        ].map((item) => (
          <Col key={item.label} span={6}>
            <Card className="page-card">
              <Typography.Text type="secondary">{item.label}</Typography.Text>
              <Typography.Title level={3} style={{ marginTop: 12, marginBottom: 0 }}>{item.value}</Typography.Title>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="page-card" title="区域汇总">
        <Table
          rowKey="id"
          dataSource={regionRows}
          pagination={false}
          columns={[
            { title: "大区", dataIndex: "region", width: 160 },
            { title: "应签收条数", dataIndex: "shouldCount", width: 140 },
            { title: "实际提交条数", dataIndex: "submittedCount", width: 140 },
            { title: "审核通过条数", dataIndex: "approvedCount", width: 140 },
            { title: "签收率", dataIndex: "rate", width: 120 },
          ]}
        />
      </Card>

      <Card className="page-card" title="经销商明细">
        <Table
          rowKey="id"
          dataSource={dealerRows}
          pagination={false}
          columns={[
            { title: "经销商编码", dataIndex: "dealerCode", width: 160 },
            { title: "经销商名称", dataIndex: "dealerName", width: 260 },
            { title: "应签收条数", dataIndex: "shouldCount", width: 140 },
            { title: "实际提交条数", dataIndex: "submittedCount", width: 140 },
            { title: "审核通过条数", dataIndex: "approvedCount", width: 140 },
            { title: "签收率", dataIndex: "rate", width: 120 },
          ]}
        />
      </Card>
    </Space>
  );
}
