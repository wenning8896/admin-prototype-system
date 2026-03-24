import { App, Button, Card, Descriptions, Form, Input, Modal, Space, Table, Tag, Timeline, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type {
  InterceptionReleaseApplicationRecord,
  InterceptionReleaseApplicationStatus,
  InterceptionReleaseEffectiveStatus,
  InterceptionReleaseProductItem,
} from "../mocks/interceptionReleaseApplication.mock";
import {
  createInterceptionReleaseApplication,
  getInterceptionReleaseApplicationById,
  invalidateInterceptionReleaseApplication,
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

const effectiveStatusColorMap: Record<InterceptionReleaseEffectiveStatus, string> = {
  有效: "success",
  失效: "default",
};

export function InterceptionReleaseApplicationDetailPage() {
  const [form] = Form.useForm<ApplicationFormValues>();
  const { message, modal } = App.useApp();
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
      form.setFieldsValue({ products: [] });
      return;
    }

    if (!detailId) {
      return;
    }

    if (!record) {
      return;
    }
    const nextProducts = record.products.map((item) => ({
      optionId: `${item.shipToCode}-${item.shape2}-${item.productCode}`,
      shipToCode: item.shipToCode,
      shipToName: item.shipToName,
      shape2: item.shape2,
      productCode: item.productCode,
      productName: item.productName,
    }));
    form.setFieldsValue({
      applyReason: record.applyReason,
      products: nextProducts,
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
      l4: "",
      l5: "",
      l6: "",
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
    setSelectedProductKeys(watchedProducts.map((item) => item.optionId ?? `${item.shipToCode}-${item.productCode}`));
    setProductModalOpen(true);
  }

  function handleConfirmProducts() {
    const selected = productOptions
      .filter((item) => selectedProductKeys.includes(item.id))
      .map((item) => ({
        optionId: item.id,
        shipToCode: item.shipToCode,
        shipToName: item.shipToName,
        shape2: item.shape2,
        productCode: item.productCode,
        productName: item.productName,
      }));
    form.setFieldValue("products", selected);
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
              {!isCreate && record ? <Tag color={effectiveStatusColorMap[record.effectiveStatus]}>{record.effectiveStatus}</Tag> : null}
            </Space>
          </Space>
          {isView ? (
            record?.effectiveStatus === "有效" ? (
              <Button
                danger
                onClick={() => {
                  modal.confirm({
                    title: "确认将该申请置为失效？",
                    content: "失效后该申请的生效状态会更新为失效。",
                    okText: "确认失效",
                    cancelText: "取消",
                    onOk: async () => {
                      invalidateInterceptionReleaseApplication({
                        id: record.id,
                        reviewerAccount: "admin",
                        reviewerName: "管理员",
                      });
                      void message.success("解除拦截申请已置为失效。");
                      navigate("/admin/order/interception-release-application");
                    },
                  });
                }}
              >
                置为失效
              </Button>
            ) : null
          ) : (
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
        <Form.Item name="products" hidden>
          <Input />
        </Form.Item>
        <Space direction="vertical" size={16} className="page-stack">
          <Card className="page-card" title="基础信息">
            {isCreate && dealerInfo ? (
              <Descriptions column={2} className="agreement-detail__descriptions">
                <Descriptions.Item label="申请单号">提交后自动生成</Descriptions.Item>
                <Descriptions.Item label="审批节点">平台审批节点</Descriptions.Item>
                <Descriptions.Item label="业务单元">{dealerInfo.businessUnit}</Descriptions.Item>
                <Descriptions.Item label="大区">{dealerInfo.region}</Descriptions.Item>
                <Descriptions.Item label="CG">{dealerInfo.cg}</Descriptions.Item>
                <Descriptions.Item label="经销商编码">{dealerInfo.dealerCode}</Descriptions.Item>
                <Descriptions.Item label="经销商名称">{dealerInfo.dealerName}</Descriptions.Item>
                <Descriptions.Item label="经销商类型">{dealerInfo.dealerType}</Descriptions.Item>
                <Descriptions.Item label="申请时间">提交后生成</Descriptions.Item>
                <Descriptions.Item label="生效状态">失效</Descriptions.Item>
              </Descriptions>
            ) : record ? (
              <Descriptions column={2} className="agreement-detail__descriptions">
                <Descriptions.Item label="申请单号">{record.applicationNo}</Descriptions.Item>
                <Descriptions.Item label="审批节点">{record.approvalNode}</Descriptions.Item>
                <Descriptions.Item label="业务单元">{record.businessUnit}</Descriptions.Item>
                <Descriptions.Item label="大区">{record.region}</Descriptions.Item>
                <Descriptions.Item label="CG">{record.cg}</Descriptions.Item>
                <Descriptions.Item label="经销商编码">{record.dealerCode}</Descriptions.Item>
                <Descriptions.Item label="经销商名称">{record.dealerName}</Descriptions.Item>
                <Descriptions.Item label="经销商类型">{record.dealerType}</Descriptions.Item>
                <Descriptions.Item label="申请时间">{record.appliedAt}</Descriptions.Item>
                <Descriptions.Item label="生效状态">
                  <Tag color={effectiveStatusColorMap[record.effectiveStatus]}>{record.effectiveStatus}</Tag>
                </Descriptions.Item>
              </Descriptions>
            ) : null}
          </Card>

          <Card
            className="page-card"
            title="产品信息"
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
                          const nextProducts = watchedProducts.filter(
                            (item) =>
                              (item.optionId ?? `${item.shipToCode}-${item.productCode}`) !==
                              (row.optionId ?? `${row.shipToCode}-${row.productCode}`),
                          );
                          form.setFieldValue("products", nextProducts);
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

          {isView && record ? (
            <Card className="page-card" title="审批流转记录">
              <Timeline
                items={(record.approvalHistory ?? []).map((item) => ({
                  color: item.decision === "审批驳回" ? "red" : item.decision === "审批通过" ? "green" : "blue",
                  children: (
                    <Space direction="vertical" size={4}>
                      <Typography.Text strong>{item.nodeName}</Typography.Text>
                      <Typography.Text type="secondary">
                        {item.role} · {item.operatorName}（{item.account}） · {item.operatedAt}
                      </Typography.Text>
                      <Typography.Text>{item.decision}</Typography.Text>
                      <Typography.Text type="secondary">{item.remark}</Typography.Text>
                    </Space>
                  ),
                }))}
              />
            </Card>
          ) : null}
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
