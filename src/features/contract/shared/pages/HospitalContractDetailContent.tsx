import { App, Button, Card, DatePicker, Descriptions, Form, Input, InputNumber, Modal, Row, Col, Select, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../../auth/useAuth";
import type { ContractActionType, HospitalContractDetailValues, HospitalContractProduct, HospitalContractRecord } from "../mocks/hospitalContract.mock";
import {
  buildDefaultContractValues,
  canClose,
  canRenewOrSupplement,
  getHospitalContractById,
  mapRecordToDetailValues,
  submitHospitalContractAction,
  triggerContractClose,
} from "../services/hospitalContract.mock-service";

type DetailMode = "create" | "view" | "edit" | "renew" | "supplement";

type Props = {
  role: "admin" | "dealer";
  title: string;
  backPath: string;
};

type LocationState = {
  mode?: DetailMode;
};

type ContractFormValues = Omit<
  HospitalContractDetailValues,
  "signedAt" | "expiredAt" | "thirdPartyEffectiveAt" | "authorizationEffectiveAt" | "authorizationExpiredAt"
> & {
  signedAt?: Dayjs;
  expiredAt?: Dayjs;
  thirdPartyEffectiveAt?: Dayjs;
  authorizationEffectiveAt?: Dayjs;
  authorizationExpiredAt?: Dayjs;
};

function toActor(name: string, account: string, role: "admin" | "dealer") {
  return {
    name,
    account,
    roleLabel: role === "admin" ? "管理员" : "经销商",
  };
}

function getSubmitAction(mode: DetailMode): ContractActionType {
  if (mode === "renew") {
    return "续签";
  }
  if (mode === "supplement") {
    return "补充SKU";
  }
  return "新建合同";
}

function toDayjsValue(value?: string) {
  return value ? dayjs(value) : undefined;
}

function toFormValues(values: HospitalContractDetailValues): ContractFormValues {
  return {
    ...values,
    signedAt: toDayjsValue(values.signedAt),
    expiredAt: toDayjsValue(values.expiredAt),
    thirdPartyEffectiveAt: toDayjsValue(values.thirdPartyEffectiveAt),
    authorizationEffectiveAt: toDayjsValue(values.authorizationEffectiveAt),
    authorizationExpiredAt: toDayjsValue(values.authorizationExpiredAt),
  };
}

function normalizeSubmitValues(values: ContractFormValues): HospitalContractDetailValues {
  return {
    ...values,
    signedAt: values.signedAt?.format("YYYY-MM-DD") ?? "",
    expiredAt: values.expiredAt?.format("YYYY-MM-DD") ?? "",
    thirdPartyEffectiveAt: values.thirdPartyEffectiveAt?.format("YYYY-MM-DD") ?? "",
    authorizationEffectiveAt: values.authorizationEffectiveAt?.format("YYYY-MM-DD") ?? "",
    authorizationExpiredAt: values.authorizationExpiredAt?.format("YYYY-MM-DD") ?? "",
    products: (values.products ?? []).map((item) => ({
      id: item.id,
      productCode: item.productCode,
      productName: item.productName,
      suggestedPrice: Number(item.suggestedPrice ?? 0),
      price: Number(item.price ?? item.suggestedPrice ?? 0),
    })),
    receivers: values.receivers ?? [],
  };
}

export function HospitalContractDetailContent({ role, title, backPath }: Props) {
  const [form] = Form.useForm<ContractFormValues>();
  const { message, modal } = App.useApp();
  const { detailId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const mode = state?.mode ?? (detailId === "new" ? "create" : "view");
  const { user } = useAuth();
  const [record, setRecord] = useState<HospitalContractRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const watchedProducts = Form.useWatch("products", form) ?? [];
  const watchedReceivers = Form.useWatch("receivers", form) ?? [];
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [selectedProductRowKeys, setSelectedProductRowKeys] = useState<React.Key[]>([]);

  const readonly = mode === "view";
  const actor = toActor(user?.name ?? (role === "admin" ? "管理员" : "经销商"), user?.account ?? role, role);

  const productCatalog = useMemo(
    () => [
      { id: "catalog-1", productCode: "P-1001", productName: "启赋配方奶粉 1 段", suggestedPrice: 328 },
      { id: "catalog-2", productCode: "P-1002", productName: "启赋配方奶粉 2 段", suggestedPrice: 338 },
      { id: "catalog-3", productCode: "P-2001", productName: "启赋敏适", suggestedPrice: 398 },
      { id: "catalog-4", productCode: "P-3001", productName: "启赋有机 3 段", suggestedPrice: 368 },
      { id: "catalog-5", productCode: "P-4001", productName: "启赋蕴淳 1 段", suggestedPrice: 348 },
      { id: "catalog-6", productCode: "P-5001", productName: "启赋未来 4 段", suggestedPrice: 288 },
    ],
    [],
  );

  function renderTwoColumnFields(fields: React.ReactNode[]) {
    return (
      <Row gutter={[16, 0]}>
        {fields.map((field, index) => (
          <Col key={index} xs={24} md={12}>
            {field}
          </Col>
        ))}
      </Row>
    );
  }

  useEffect(() => {
    void (async () => {
      if (!detailId || detailId === "new") {
        form.setFieldsValue(toFormValues(buildDefaultContractValues()));
        setRecord(null);
        return;
      }

      const next = await getHospitalContractById(detailId);
      setRecord(next);
      form.setFieldsValue(next ? toFormValues(mapRecordToDetailValues(next)) : toFormValues(buildDefaultContractValues()));
    })();
  }, [detailId, form]);

  const productColumns: ColumnsType<HospitalContractProduct> = [
    {
      title: "产品编码",
      dataIndex: "productCode",
      width: 180,
      render: (value: string) => value || "-",
    },
    {
      title: "产品名称",
      dataIndex: "productName",
      width: 220,
      render: (value: string) => value || "-",
    },
    {
      title: "建议价格",
      dataIndex: "suggestedPrice",
      width: 140,
      render: (value: number) => `¥ ${Number(value ?? 0).toFixed(2)}`,
    },
    {
      title: "价格",
      dataIndex: "price",
      width: 160,
      render: (_: unknown, __: HospitalContractProduct, index: number) =>
        readonly ? (
          `¥ ${Number(form.getFieldValue(["products", index, "price"]) ?? form.getFieldValue(["products", index, "suggestedPrice"]) ?? 0).toFixed(2)}`
        ) : (
          <Form.Item
            name={["products", index, "price"]}
            noStyle
            rules={[{ required: true, message: "请输入价格" }]}
          >
            <InputNumber min={0} precision={2} style={{ width: "100%" }} placeholder="请输入价格" />
          </Form.Item>
        ),
    },
    ...(readonly
      ? []
      : [
          {
            title: "操作",
            key: "actions",
            width: 100,
            render: (_: unknown, __: HospitalContractProduct, index: number) => (
              <Button
                type="link"
                danger
                onClick={() => {
                  const nextProducts = [...watchedProducts];
                  nextProducts.splice(index, 1);
                  form.setFieldValue("products", nextProducts);
                }}
              >
                删除
              </Button>
            ),
          },
        ]),
  ];

  async function handleSubmit() {
    const values = normalizeSubmitValues(await form.validateFields());
    const actionType = getSubmitAction(mode);
    setSubmitting(true);
    try {
      const next = await submitHospitalContractAction(values, actionType, actor, detailId === "new" ? undefined : detailId);
      void message.success(`${actionType}已提交审批。`);
      navigate(`${backPath}/detail/${next.id}`, { state: { mode: "view" satisfies DetailMode } });
    } finally {
      setSubmitting(false);
    }
  }

  function handleCloseContract() {
    if (!record) {
      return;
    }

    modal.confirm({
      title: "确认关闭合同？",
      content: "确认发起关闭后，合同将直接关闭。关闭后的合同无法再进行续签、补充SKU等操作。",
      okText: "确认关闭",
      cancelText: "取消",
      onOk: async () => {
        await triggerContractClose(record.id, actor);
        void message.success("合同已关闭。");
        navigate(backPath);
      },
    });
  }

  function handleOpenProductPicker() {
    const currentProductCodes = new Set((watchedProducts ?? []).map((item) => item.productCode));
    setSelectedProductRowKeys(
      productCatalog.filter((item) => currentProductCodes.has(item.productCode)).map((item) => item.id),
    );
    setProductPickerOpen(true);
  }

  function handleConfirmProductSelection() {
    const selectedProducts = productCatalog.filter((item) => selectedProductRowKeys.includes(item.id));
    if (selectedProducts.length === 0) {
      setProductPickerOpen(false);
      return;
    }

    form.setFieldValue(
      "products",
      selectedProducts.map((item) => ({
        id: item.id,
        productCode: item.productCode,
        productName: item.productName,
        suggestedPrice: item.suggestedPrice,
        price: item.suggestedPrice,
      })),
    );
    setProductPickerOpen(false);
  }

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card">
        <div className="agreement-detail__header">
          <Space align="center" size={12}>
            <Button onClick={() => navigate(backPath)}>返回列表</Button>
            <Typography.Title level={4} className="agreement-detail__title">
              {title}
            </Typography.Title>
            {record ? <Tag color={record.lifeStatus === "有效" ? "success" : "default"}>{record.lifeStatus}</Tag> : null}
          </Space>
          <Space>
            {!readonly ? (
              <Button type="primary" loading={submitting} onClick={() => void handleSubmit()}>
                提交
              </Button>
            ) : null}
            {readonly && record && canRenewOrSupplement(record) ? (
              <>
                <Button onClick={() => navigate(`${backPath}/detail/${record.id}`, { state: { mode: "renew" satisfies DetailMode } })}>续签</Button>
                <Button onClick={() => navigate(`${backPath}/detail/${record.id}`, { state: { mode: "supplement" satisfies DetailMode } })}>补充 SKU</Button>
              </>
            ) : null}
            {readonly && record && canClose(record) ? <Button danger onClick={handleCloseContract}>关闭</Button> : null}
          </Space>
        </div>
      </Card>

      {record ? (
        <Card className="page-card">
          <Descriptions column={4} size="small">
            <Descriptions.Item label="合同编号">{record.contractNo}</Descriptions.Item>
            <Descriptions.Item label="提交人">{record.submitterName}</Descriptions.Item>
            <Descriptions.Item label="提交时间">{record.createdAt}</Descriptions.Item>
            <Descriptions.Item label="当前节点">{record.currentApprovalNode ?? "-"}</Descriptions.Item>
          </Descriptions>
        </Card>
      ) : null}

      <Form form={form} layout="vertical" disabled={readonly}>
        <Card className="page-card" title="经销商信息">
          {renderTwoColumnFields([
            <Form.Item name="dealerCode" label="经销商编码" rules={[{ required: true, message: "请输入经销商编码" }]}>
              <Input placeholder="请输入经销商编码" />
            </Form.Item>,
            <Form.Item name="dealerName" label="经销商名称" rules={[{ required: true, message: "请输入经销商名称" }]}>
              <Input placeholder="请输入经销商名称" />
            </Form.Item>,
            <Form.Item name="region" label="大区" rules={[{ required: true, message: "请输入大区" }]}>
              <Input placeholder="请输入大区" />
            </Form.Item>,
            <Form.Item name="cg" label="CG" rules={[{ required: true, message: "请输入CG" }]}>
              <Input placeholder="请输入CG" />
            </Form.Item>,
            <Form.Item name="province" label="省份" rules={[{ required: true, message: "请输入省份" }]}>
              <Select
                placeholder="请选择省份"
                options={["上海市", "北京市", "广东省", "江苏省", "浙江省"].map((item) => ({ label: item, value: item }))}
              />
            </Form.Item>,
          ])}
        </Card>

        <Card className="page-card" title="医院信息">
          {renderTwoColumnFields([
            <Form.Item name="dmsHospitalCode" label="DMS医院编码" rules={[{ required: true, message: "请输入DMS医院编码" }]}>
              <Input placeholder="请输入DMS医院编码" />
            </Form.Item>,
            <Form.Item name="dmsHospitalName" label="DMS医院名称" rules={[{ required: true, message: "请输入DMS医院名称" }]}>
              <Input placeholder="请输入DMS医院名称" />
            </Form.Item>,
            <Form.Item name="dmsHospitalCooperationStatus" label="DMS医院合作状态" rules={[{ required: true, message: "请选择合作状态" }]}>
              <Select options={[{ label: "Y", value: "Y" }, { label: "N", value: "N" }]} />
            </Form.Item>,
            <Form.Item name="signHospitalEtmsId" label="签署合同医院ETMS-ID" rules={[{ required: true, message: "请输入ETMS-ID" }]}>
              <Input placeholder="请输入签署合同医院ETMS-ID" />
            </Form.Item>,
            <Form.Item name="useProductEtmsId" label="使用产品医院ETMS-ID" rules={[{ required: true, message: "请输入ETMS-ID" }]}>
              <Input placeholder="请输入使用产品医院ETMS-ID" />
            </Form.Item>,
          ])}
        </Card>

        <Card className="page-card" title="地址信息">
          {renderTwoColumnFields([
            <Form.Item name="dmsHospitalAddress" label="DMS医院地址" rules={[{ required: true, message: "请输入DMS医院地址" }]}>
              <Input placeholder="请输入DMS医院地址" />
            </Form.Item>,
            <Form.Item name="deliveryAddress" label="合同签署中送货地址" rules={[{ required: true, message: "请输入送货地址" }]}>
              <Input placeholder="请输入合同签署中送货地址" />
            </Form.Item>,
          ])}
        </Card>

        <Card className="page-card" title="合同主要信息">
          {renderTwoColumnFields([
            <Form.Item name="contractForm" label="合同形式" rules={[{ required: true, message: "请选择合同形式" }]}>
              <Select
                options={[
                  { label: "公对公合同-医院公章", value: "公对公合同-医院公章" },
                  { label: "公对公合同-科室章", value: "公对公合同-科室章" },
                  { label: "公对公合同-医院授权第三方", value: "公对公合同-医院授权第三方" },
                ]}
              />
            </Form.Item>,
            <Form.Item name="transferType" label="转账类型" rules={[{ required: true, message: "请选择转账类型" }]}>
              <Select
                options={[
                  { label: "公对公转账（医院）", value: "公对公转账（医院）" },
                  { label: "公对公转账（医院授权第三方）", value: "公对公转账（医院授权第三方）" },
                ]}
              />
            </Form.Item>,
            <Form.Item name="contractDepartmentType" label="合同签署部门类型" rules={[{ required: true, message: "请输入合同签署部门类型" }]}>
              <Input placeholder="请输入合同签署部门类型" />
            </Form.Item>,
            <Form.Item name="signatoryFullName" label="签署方全称" rules={[{ required: true, message: "请输入签署方全称" }]}>
              <Input placeholder="请输入签署方全称" />
            </Form.Item>,
            <Form.Item name="sealName" label="合同盖章名称" rules={[{ required: true, message: "请输入合同盖章名称" }]}>
              <Input placeholder="请输入合同盖章名称" />
            </Form.Item>,
          ])}
        </Card>

        <Card className="page-card" title="付款信息">
          {renderTwoColumnFields([
            <Form.Item name="paymentAccount" label="付款账号" rules={[{ required: true, message: "请输入付款账号" }]}>
              <Input placeholder="请输入付款账号" />
            </Form.Item>,
            <Form.Item name="accountHolderName" label="账户持有人名称" rules={[{ required: true, message: "请输入账户持有人名称" }]}>
              <Input placeholder="请输入账户持有人名称" />
            </Form.Item>,
            <Form.Item name="bankName" label="开户银行全称" rules={[{ required: true, message: "请输入开户银行全称" }]}>
              <Input placeholder="请输入开户银行全称" />
            </Form.Item>,
          ])}
        </Card>

        <Card
          className="page-card"
          title="医院指定收货人信息"
        >
          <Form.Item name="authorizedReceiver" label="医院授权第三方采购公司的指定收货人" rules={[{ required: true, message: "请输入指定收货人" }]}>
            <Input placeholder="请输入医院授权第三方采购公司的指定收货人" />
          </Form.Item>
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            {(watchedReceivers ?? []).slice(0, 4).map((item, index) => (
              <Row key={item.id ?? index} gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name={["receivers", index, "receiverName"]}
                    label={index === 0 ? "收货人姓名" : " "}
                    rules={[{ required: true, message: "请输入收货人姓名" }]}
                  >
                    <Input placeholder="请输入收货人姓名" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name={["receivers", index, "receiverCode"]}
                    label={index === 0 ? "收货人ID" : " "}
                    rules={[{ required: true, message: "请输入收货人ID" }]}
                  >
                    <Input placeholder="请输入收货人ID" />
                  </Form.Item>
                </Col>
              </Row>
            ))}
          </Space>
        </Card>

        <Card className="page-card" title="合同期限信息">
          {renderTwoColumnFields([
            <Form.Item name="signedAt" label="合同签署时间" rules={[{ required: true, message: "请选择合同签署时间" }]}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>,
            <Form.Item name="expiredAt" label="合同到期时间" rules={[{ required: true, message: "请选择合同到期时间" }]}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>,
            <Form.Item name="renewalType" label="延期类型" rules={[{ required: true, message: "请选择延期类型" }]}>
              <Select
                options={[
                  { label: "无自动延期", value: "无自动延期" },
                  { label: "自动延期", value: "自动延期" },
                  { label: "无限延期", value: "无限延期" },
                ]}
              />
            </Form.Item>,
            <Form.Item name="autoRenewYears" label="自动延期（年）" rules={[{ required: true, message: "请输入自动延期年数" }]}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>,
            <Form.Item name="renewedDuration" label="已延期时间">
              <Input placeholder="例如 1 次" />
            </Form.Item>,
            <Form.Item name="thirdPartyEffectiveAt" label="第三方公司生效时间">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>,
            <Form.Item name="authorizationMode" label="医院指定第三方采购授权方式">
              <Select
                placeholder="请选择授权方式"
                options={[
                  { label: "医院授权第三方", value: "医院授权第三方" },
                  { label: "医院指定收货人", value: "医院指定收货人" },
                ]}
              />
            </Form.Item>,
            <Form.Item name="authorizationEffectiveAt" label="授权书生效时间">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>,
            <Form.Item name="authorizationExpiredAt" label="授权书失效时间">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>,
          ])}
        </Card>

        <Card
          className="page-card"
          title="产品信息"
          extra={
            !readonly ? (
              <Button
                type="link"
                onClick={handleOpenProductPicker}
              >
                添加产品
              </Button>
            ) : null
          }
        >
          <Table
            rowKey="id"
            pagination={false}
            tableLayout="fixed"
            columns={productColumns}
            dataSource={watchedProducts}
            scroll={{ x: 920 }}
          />
        </Card>

        <Card className="page-card" title="合同附件信息">
          <Form.Item name="contractAttachmentName" label="合同附件">
            <Input placeholder="请输入合同附件名称" />
          </Form.Item>
        </Card>
      </Form>

      <Modal
        title="选择产品"
        open={productPickerOpen}
        onCancel={() => setProductPickerOpen(false)}
        onOk={handleConfirmProductSelection}
        okText="确认添加"
        cancelText="取消"
        width={880}
      >
        <Table
          rowKey="id"
          dataSource={productCatalog}
          pagination={false}
          rowSelection={{
            selectedRowKeys: selectedProductRowKeys,
            onChange: setSelectedProductRowKeys,
          }}
          columns={[
            { title: "产品编码", dataIndex: "productCode", width: 180 },
            { title: "产品名称", dataIndex: "productName", width: 260 },
            { title: "建议价格", dataIndex: "suggestedPrice", width: 140, render: (value: number) => `¥ ${value.toFixed(2)}` },
          ]}
        />
      </Modal>
    </Space>
  );
}
