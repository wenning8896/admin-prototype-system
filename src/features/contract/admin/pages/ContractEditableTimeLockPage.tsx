import { App, Button, Card, DatePicker, Form, Space } from "antd";

type TimeLockValues = {
  startDate?: string;
  endDate?: string;
};

export function ContractEditableTimeLockPage() {
  const [form] = Form.useForm<TimeLockValues>();
  const { message } = App.useApp();

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card" title="合同可编辑时间锁">
        <Form form={form} layout="vertical">
          <div className="agreement-page__filters">
            <Form.Item name="startDate" label="开始日期" rules={[{ required: true, message: "请选择开始日期" }]}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="endDate" label="结束日期" rules={[{ required: true, message: "请选择结束日期" }]}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </div>
          <Space>
            <Button onClick={() => window.history.back()}>返回</Button>
            <Button type="primary" onClick={() => void message.success("合同可编辑时间锁已保存。")}>保存</Button>
          </Space>
        </Form>
      </Card>
    </Space>
  );
}
