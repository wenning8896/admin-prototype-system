import { App, Button, Card, Form, Input, Select, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { InterceptionReleaseApplicationRecord, InterceptionReleaseApplicationStatus, InterceptionReleaseProductItem } from "../mocks/interceptionReleaseApplication.mock";
import {
  createInterceptionReleaseApplication,
  getInterceptionReleaseApplicationById,
  listInterceptEligibleDealers,
  listInterceptProductOptionsByDealer,
} from "../services/interceptionReleaseApplication.mock-service";

type ProductFormItem = {
  optionId?: string;
  shipToCode?: string;
  shipToName?: string;
  shape2?: string;
  productCode?: string;
  productName?: string;
};

type ApplicationFormValues = {
  applyReason: string;
  products: ProductFormItem[];
};

const statusColorMap: Record<InterceptionReleaseApplicationStatus, string> = {
  待审批: "processing",
  审批通过: "success",
  审批驳回: "error",
};

export function InterceptionReleaseApplicationDetailPage() {
  const [form] = Form.useForm<ApplicationFormValues>();
  const { message } = App.useApp();
  const { detailId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const mode = new URLSearchParams(location.search).get("mode") ?? "view";
  const dealerCode = new URLSearchParams(location.search).get("dealerCode") ?? "";
  const isCreate = detailId === "new";
  const isView = mode === "view";
  const dealerInfo = useMemo(() => {
    if (!dealerCode) {
      return null;
    }
    return listInterceptEligibleDealers().find((item) => item.dealerCode === dealerCode) ?? null;
  }, [dealerCode]);

  const productOptions = useMemo(
    () => (dealerCode ? listInterceptProductOptionsByDealer(dealerCode) : []),
    [dealerCode],
  );
  const record = useMemo<InterceptionReleaseApplicationRecord | null>(
    () => (isCreate || !detailId ? null : getInterceptionReleaseApplicationById(detailId)),
    [detailId, isCreate],
  );

  useEffect(() => {
    if (isCreate) {
      form.setFieldsValue({
        products: [{}],
      });
      return;
    }

    if (!detailId) {
      return;
    }

    if (!record) {
      return;
    }
    form.setFieldsValue({
      applyReason: record.applyReason,
      products: record.products.map((item) => ({
        optionId: `${item.shipToCode}-${item.shape2}-${item.productCode}`,
        shipToCode: item.shipToCode,
        shipToName: item.shipToName,
        shape2: item.shape2,
        productCode: item.productCode,
        productName: item.productName,
      })),
    });
  }, [detailId, form, isCreate, record]);

  async function handleSubmit() {
    if (!dealerInfo) {
      return;
    }
    const values = await form.validateFields();
    createInterceptionReleaseApplication({
      businessUnit: dealerInfo.businessUnit,
      region: dealerInfo.region,
      cg: dealerInfo.cg,
      dealerCode: dealerInfo.dealerCode,
      dealerName: dealerInfo.dealerName,
      applyReason: values.applyReason,
      products: (values.products ?? []).map((item) => ({
        shipToCode: item.shipToCode ?? "",
        shipToName: item.shipToName ?? "",
        shape2: item.shape2 ?? "",
        productCode: item.productCode ?? "",
        productName: item.productName ?? "",
      })),
    });
    void message.success("解除拦截申请已提交。");
    navigate("/admin/order/interception-release-application");
  }

  const productColumns: ColumnsType<InterceptionReleaseProductItem> = [
    { title: "ShipTo编码", dataIndex: "shipToCode", width: 160 },
    { title: "ShipTo名称", dataIndex: "shipToName", width: 180 },
    { title: "Shape2", dataIndex: "shape2", width: 120 },
    { title: "产品编码", dataIndex: "productCode", width: 160 },
    { title: "产品名称", dataIndex: "productName", width: 240 },
  ];

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card">
        <div className="agreement-detail__header">
          <Space align="center" size={12}>
            <Button onClick={() => navigate("/admin/order/interception-release-application")}>返回列表</Button>
            <Space align="center" size={12}>
              <Typography.Title level={4} className="agreement-detail__title">
                {isCreate ? "发起解除拦截申请" : "解除拦截申请详情"}
              </Typography.Title>
              {!isCreate && record ? <Tag color={statusColorMap[record.approvalStatus]}>{record.approvalStatus}</Tag> : null}
            </Space>
          </Space>
          {isView ? null : (
            <Space>
              <Button onClick={() => navigate("/admin/order/interception-release-application")}>取消</Button>
              <Button type="primary" onClick={() => void handleSubmit()}>
                提交申请
              </Button>
            </Space>
          )}
        </div>
      </Card>

      <Form form={form} layout="vertical" disabled={isView}>
        <Space direction="vertical" size={16} className="page-stack">
          <Card className="page-card" title="经销商信息">
            {isCreate && dealerInfo ? (
              <div className="agreement-detail__descriptions">
                <div>业务单元：{dealerInfo.businessUnit}</div>
                <div>大区：{dealerInfo.region}</div>
                <div>CG：{dealerInfo.cg}</div>
                <div>经销商编码：{dealerInfo.dealerCode}</div>
                <div>经销商名称：{dealerInfo.dealerName}</div>
              </div>
            ) : record ? (
              <div className="agreement-detail__descriptions">
                <div>业务单元：{record.businessUnit}</div>
                <div>大区：{record.region}</div>
                <div>CG：{record.cg}</div>
                <div>经销商编码：{record.dealerCode}</div>
                <div>经销商名称：{record.dealerName}</div>
                <div>申请单号：{record.applicationNo}</div>
                <div>审批节点：{record.approvalNode}</div>
              </div>
            ) : null}
          </Card>

          <Card className="page-card" title="产品信息模块">
            {isView && record ? (
              <Table
                rowKey="id"
                dataSource={record.products}
                columns={productColumns}
                pagination={false}
                tableLayout="fixed"
                scroll={{ x: 960 }}
              />
            ) : (
              <Form.List name="products">
                {(fields, { add, remove }) => (
                  <Space direction="vertical" size={12} style={{ width: "100%" }}>
                    {fields.map((field) => (
                      <div key={field.key} className="customer-distributor-detail__editable-row">
                        <Form.Item
                          name={[field.name, "optionId"]}
                          rules={[{ required: true, message: "请选择 Shape2 和产品" }]}
                        >
                          <Select
                            placeholder="选择 Shape2 / 产品"
                            options={productOptions.map((item) => ({ label: item.label, value: item.id }))}
                            onChange={(value) => {
                              const selected = productOptions.find((item) => item.id === value);
                              if (!selected) {
                                return;
                              }
                              form.setFieldValue(["products", field.name, "shipToCode"], selected.shipToCode);
                              form.setFieldValue(["products", field.name, "shipToName"], selected.shipToName);
                              form.setFieldValue(["products", field.name, "shape2"], selected.shape2);
                              form.setFieldValue(["products", field.name, "productCode"], selected.productCode);
                              form.setFieldValue(["products", field.name, "productName"], selected.productName);
                            }}
                          />
                        </Form.Item>
                        <Form.Item name={[field.name, "shipToCode"]}>
                          <Input placeholder="ShipTo编码" readOnly />
                        </Form.Item>
                        <Form.Item name={[field.name, "shipToName"]}>
                          <Input placeholder="ShipTo名称" readOnly />
                        </Form.Item>
                        <Form.Item name={[field.name, "shape2"]}>
                          <Input placeholder="Shape2" readOnly />
                        </Form.Item>
                        <Form.Item name={[field.name, "productCode"]}>
                          <Input placeholder="产品编码" readOnly />
                        </Form.Item>
                        <Form.Item name={[field.name, "productName"]}>
                          <Input placeholder="产品名称" readOnly />
                        </Form.Item>
                        <div className="customer-distributor-detail__editable-action">
                          <Button type="link" danger onClick={() => remove(field.name)}>
                            删除
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button onClick={() => add({})}>新增产品</Button>
                  </Space>
                )}
              </Form.List>
            )}
          </Card>

          <Card className="page-card" title="申请信息">
            {isView && record ? (
              <Typography.Paragraph>{record.applyReason}</Typography.Paragraph>
            ) : (
              <Form.Item name="applyReason" label="申请原因" rules={[{ required: true, message: "请输入申请原因" }]}>
                <Input.TextArea rows={4} placeholder="请输入解除拦截申请原因" />
              </Form.Item>
            )}
          </Card>
        </Space>
      </Form>
    </Space>
  );
}
