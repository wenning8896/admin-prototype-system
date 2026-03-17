import { App, Button, Card, Descriptions, Form, Input, Modal, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
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
  applyReason?: string;
  attachmentName?: string;
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
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [selectedProductKeys, setSelectedProductKeys] = useState<React.Key[]>([]);
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
  const watchedProducts = Form.useWatch("products", form) ?? [];
  const record = useMemo<InterceptionReleaseApplicationRecord | null>(
    () => (isCreate || !detailId ? null : getInterceptionReleaseApplicationById(detailId)),
    [detailId, isCreate],
  );

  useEffect(() => {
    if (isCreate) {
      form.setFieldsValue({
        products: [],
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
      l4: dealerInfo.l4,
      l5: dealerInfo.l5,
      l6: dealerInfo.l6,
      dealerType: dealerInfo.dealerType,
      applyReason: values.applyReason ?? "",
      attachmentName: values.attachmentName,
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

  function handleOpenProductModal() {
    setSelectedProductKeys((watchedProducts ?? []).map((item) => item.optionId ?? `${item.shipToCode}-${item.productCode}`));
    setProductModalOpen(true);
  }

  function handleConfirmProducts() {
    const selected = productOptions.filter((item) => selectedProductKeys.includes(item.id));
    form.setFieldValue(
      "products",
      selected.map((item) => ({
        optionId: item.id,
        shipToCode: item.shipToCode,
        shipToName: item.shipToName,
        shape2: item.shape2,
        productCode: item.productCode,
        productName: item.productName,
      })),
    );
    setProductModalOpen(false);
  }

  const productColumns: ColumnsType<InterceptionReleaseProductItem> = [
    { title: "ShipTo编码", dataIndex: "shipToCode", width: 160 },
    { title: "ShipTo名称", dataIndex: "shipToName", width: 180 },
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
              <Descriptions column={2} className="agreement-detail__descriptions">
                <Descriptions.Item label="业务单元">{dealerInfo.businessUnit}</Descriptions.Item>
                <Descriptions.Item label="大区">{dealerInfo.region}</Descriptions.Item>
                <Descriptions.Item label="CG">{dealerInfo.cg}</Descriptions.Item>
                <Descriptions.Item label="经销商编码">{dealerInfo.dealerCode}</Descriptions.Item>
                <Descriptions.Item label="经销商名称">{dealerInfo.dealerName}</Descriptions.Item>
                <Descriptions.Item label="经销商类型">{dealerInfo.dealerType}</Descriptions.Item>
                <Descriptions.Item label="L4">{dealerInfo.l4}</Descriptions.Item>
                <Descriptions.Item label="L5 / L6">{`${dealerInfo.l5} / ${dealerInfo.l6}`}</Descriptions.Item>
              </Descriptions>
            ) : record ? (
              <Descriptions column={2} className="agreement-detail__descriptions">
                <Descriptions.Item label="业务单元">{record.businessUnit}</Descriptions.Item>
                <Descriptions.Item label="大区">{record.region}</Descriptions.Item>
                <Descriptions.Item label="CG">{record.cg}</Descriptions.Item>
                <Descriptions.Item label="经销商编码">{record.dealerCode}</Descriptions.Item>
                <Descriptions.Item label="经销商名称">{record.dealerName}</Descriptions.Item>
                <Descriptions.Item label="经销商类型">{record.dealerType}</Descriptions.Item>
                <Descriptions.Item label="L4">{record.l4}</Descriptions.Item>
                <Descriptions.Item label="L5 / L6">{`${record.l5} / ${record.l6}`}</Descriptions.Item>
                <Descriptions.Item label="申请单号">{record.applicationNo}</Descriptions.Item>
                <Descriptions.Item label="审批节点">{record.approvalNode}</Descriptions.Item>
              </Descriptions>
            ) : null}
          </Card>

          <Card
            className="page-card"
            title="产品信息模块"
            extra={
              !isView ? (
                <Button onClick={handleOpenProductModal}>新增产品</Button>
              ) : null
            }
          >
            {isView && record ? (
              <Table
                rowKey="id"
                dataSource={record.products}
                columns={productColumns}
                pagination={false}
                tableLayout="fixed"
                scroll={{ x: 860 }}
              />
            ) : (
              <Table
                rowKey={(row) => row.optionId ?? `${row.shipToCode}-${row.productCode}`}
                pagination={false}
                tableLayout="fixed"
                dataSource={watchedProducts}
                columns={[
                  { title: "ShipTo编码", dataIndex: "shipToCode", width: 160 },
                  { title: "ShipTo名称", dataIndex: "shipToName", width: 180 },
                  { title: "产品编码", dataIndex: "productCode", width: 160 },
                  { title: "产品名称", dataIndex: "productName", width: 240 },
                  {
                    title: "操作",
                    width: 100,
                    fixed: "right",
                    render: (_, row) => (
                      <Button
                        type="link"
                        danger
                        onClick={() => {
                          form.setFieldValue(
                            "products",
                            watchedProducts.filter((item) => (item.optionId ?? `${item.shipToCode}-${item.productCode}`) !== (row.optionId ?? `${row.shipToCode}-${row.productCode}`)),
                          );
                        }}
                      >
                        删除
                      </Button>
                    ),
                  },
                ]}
                scroll={{ x: 980 }}
              />
            )}
          </Card>

          <Card className="page-card" title="申请信息">
            {isView && record ? (
              <Descriptions column={1} className="agreement-detail__descriptions">
                <Descriptions.Item label="申请原因">{record.applyReason || "-"}</Descriptions.Item>
                <Descriptions.Item label="申请附件">{record.attachmentName || "-"}</Descriptions.Item>
              </Descriptions>
            ) : (
              <>
                <Form.Item name="applyReason" label="申请原因">
                  <Input.TextArea rows={4} placeholder="请输入解除拦截申请原因" />
                </Form.Item>
                <Form.Item name="attachmentName" label="申请附件">
                  <Input placeholder="请输入附件名称" />
                </Form.Item>
              </>
            )}
          </Card>
        </Space>
      </Form>

      <Modal
        title="选择产品"
        open={productModalOpen}
        onCancel={() => setProductModalOpen(false)}
        onOk={handleConfirmProducts}
        okText="确认选择"
        cancelText="取消"
        width={980}
      >
        <Table
          rowKey="id"
          dataSource={productOptions}
          pagination={false}
          tableLayout="fixed"
          rowSelection={{
            selectedRowKeys: selectedProductKeys,
            onChange: setSelectedProductKeys,
          }}
          columns={[
            { title: "ShipTo编码", dataIndex: "shipToCode", width: 160 },
            { title: "ShipTo名称", dataIndex: "shipToName", width: 200 },
            { title: "产品编码", dataIndex: "productCode", width: 160 },
            { title: "产品名称", dataIndex: "productName", width: 260 },
          ]}
          scroll={{ x: 900 }}
        />
      </Modal>
    </Space>
  );
}
