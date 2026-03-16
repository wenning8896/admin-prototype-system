import { App, Button, Card, Form, InputNumber, Space } from "antd";

export function SignReceiptUploadTimeLockPage() {
  const [form] = Form.useForm<{ days?: number }>();
  const { message } = App.useApp();

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card" title="签收单上传时间锁">
        <Form form={form} layout="vertical" initialValues={{ days: 15 }}>
          <Form.Item name="days" label="最长上传时间（天）" rules={[{ required: true, message: "请输入最长上传时间" }]}>
            <InputNumber min={1} style={{ width: 320 }} />
          </Form.Item>
          <Space>
            <Button onClick={() => window.history.back()}>返回</Button>
            <Button type="primary" onClick={() => void message.success("签收单上传时间锁已保存。")}>保存</Button>
          </Space>
        </Form>
      </Card>
    </Space>
  );
}
