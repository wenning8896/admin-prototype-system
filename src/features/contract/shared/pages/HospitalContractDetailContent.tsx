import { App, Button, Card, Checkbox, DatePicker, Descriptions, Form, Input, InputNumber, Modal, Row, Col, Select, Space, Table, Tag, Typography, Upload } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadFile } from "antd/es/upload/interface";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../../auth/useAuth";
import type { ContractActionType, HospitalContractDetailValues, HospitalContractProduct, HospitalContractRecord } from "../mocks/hospitalContract.mock";
import {
  buildDefaultContractValues,
  canClose,
  canRenew,
  canSupplement,
  getDealerProfile,
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
  returnPath?: string;
};

type ContractFormValues = Omit<
  HospitalContractDetailValues,
  "signedAt" | "expiredAt" | "thirdPartyCompanyEstablishedAt" | "thirdPartyEffectiveAt" | "authorizationEffectiveAt" | "authorizationExpiredAt"
> & {
  signedAt?: Dayjs;
  expiredAt?: Dayjs;
  thirdPartyCompanyEstablishedAt?: Dayjs;
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

function getSubmitAction(mode: DetailMode, latestActionType?: ContractActionType): ContractActionType {
  if (mode === "renew") {
    return "续签";
  }
  if (mode === "supplement") {
    return "补充SKU";
  }
  if (mode === "edit" && latestActionType) {
    return latestActionType;
  }
  return "新建合同";
}

function toDayjsValue(value?: string) {
  return value ? dayjs(value) : undefined;
}

function isThirdPartyContractForm(value?: string) {
  return value === "公对公合同-医院授权第三方";
}

function buildVersionChangeContent(actionType: ContractActionType) {
  if (actionType === "续签") {
    return "更新合同到期时间并提交续签版本。";
  }
  if (actionType === "补充SKU") {
    return "补充合同产品信息并生成新版本。";
  }
  if (actionType === "关闭合同") {
    return "发起关闭合同并归档当前版本。";
  }
  return "新建合同并生成首个生效版本。";
}

function getSupplyPriceHint(price?: number, suggestedPrice?: number) {
  const normalizedPrice = Number(price ?? 0);
  const normalizedSuggestedPrice = Number(suggestedPrice ?? 0);

  if (!normalizedPrice || !normalizedSuggestedPrice) {
    return undefined;
  }

  if (normalizedPrice > normalizedSuggestedPrice * 2) {
    return "供货价格已超出2倍QIP";
  }

  if (normalizedPrice < normalizedSuggestedPrice) {
    return "供货价格低于QIP供货";
  }

  return undefined;
}

function exportHospitalVersionNotice(fileName: string, messageApi: { success: (content: string) => void }) {
  messageApi.success(`${fileName} 已准备下载。`);
}

function toFormValues(values: HospitalContractDetailValues): ContractFormValues {
  return {
    ...values,
    signedAt: toDayjsValue(values.signedAt),
    expiredAt: toDayjsValue(values.expiredAt),
    thirdPartyCompanyEstablishedAt: toDayjsValue(values.thirdPartyCompanyEstablishedAt),
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
    thirdPartyCompanyEstablishedAt: values.thirdPartyCompanyEstablishedAt?.format("YYYY-MM-DD") ?? "",
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
  const effectiveBackPath = state?.returnPath ?? backPath;
  const { user } = useAuth();
  const [record, setRecord] = useState<HospitalContractRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const watchedProducts = Form.useWatch("products", form) ?? [];
  const watchedContractForm = Form.useWatch("contractForm", form);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [selectedProductRowKeys, setSelectedProductRowKeys] = useState<React.Key[]>([]);
  const [productItems, setProductItems] = useState<HospitalContractProduct[]>([]);

  const readonly = mode === "view";
  const dealerLocked = role === "dealer";
  const showThirdPartySection = isThirdPartyContractForm(watchedContractForm);
  const actor = toActor(user?.name ?? (role === "admin" ? "管理员" : "经销商"), user?.account ?? role, role);
  const dealerProfile = getDealerProfile(user?.account);

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
        const defaultValues = toFormValues(buildDefaultContractValues());
        if (dealerLocked) {
          defaultValues.dealerCode = dealerProfile.dealerCode;
          defaultValues.dealerName = dealerProfile.dealerName;
          defaultValues.region = dealerProfile.region;
          defaultValues.cg = dealerProfile.cg;
          defaultValues.province = dealerProfile.province;
        }
        form.setFieldsValue(defaultValues);
        setProductItems(defaultValues.products ?? []);
        setRecord(null);
        return;
      }

      const next = await getHospitalContractById(detailId);
      setRecord(next);
      const nextValues = next ? toFormValues(mapRecordToDetailValues(next)) : toFormValues(buildDefaultContractValues());
      if (dealerLocked) {
        nextValues.dealerCode = dealerProfile.dealerCode;
        nextValues.dealerName = dealerProfile.dealerName;
        nextValues.region = dealerProfile.region;
        nextValues.cg = dealerProfile.cg;
        nextValues.province = dealerProfile.province;
      }
      form.setFieldsValue(nextValues);
      setProductItems(nextValues.products ?? []);
    })();
  }, [dealerLocked, dealerProfile.cg, dealerProfile.dealerCode, dealerProfile.dealerName, dealerProfile.province, dealerProfile.region, detailId, form]);

  const receiverRows = useMemo(
    () => Array.from({ length: 4 }, (_, index) => ({ key: index + 1, index })),
    [],
  );

  const productTableData = useMemo(
    () => (productItems ?? []).map((item, index) => ({ ...item, id: item.id || `${item.productCode}-${index}` })),
    [productItems],
  );

  const versionRows = useMemo(
    () =>
      record?.versions.map((version, index, list) => ({
        ...version,
        signedAt: record.signedAt,
        expiredAt: record.expiredAt,
        changeContent: buildVersionChangeContent(version.actionType),
        status: index === list.length - 1 && record.lifeStatus === "有效" ? "生效中" : "历史版本",
        contractFileName: version.exportFileName.replace(".xlsx", ".pdf") || record.contractAttachmentName,
      })) ?? [],
    [record],
  );

  const modificationLogs = useMemo(
    () =>
      record?.approvalHistory.map((item) => ({
        id: item.id,
        actedAt: item.actedAt,
        operatorName: item.operatorName,
        detail: item.remark || item.decision,
        actionLabel: item.nodeName,
      })) ?? [],
    [record],
  );

  function renderUploadField(
    name: keyof ContractFormValues,
    label: string,
    placeholder: string,
    required = false,
  ) {
    const currentValue = form.getFieldValue(name) as string | undefined;
    const fileList: UploadFile[] = currentValue
      ? [
          {
            uid: String(name),
            name: currentValue,
            status: "done",
          },
        ]
      : [];

    return (
      <Form.Item label={label} required={required}>
        <Form.Item name={name} noStyle rules={required ? [{ required: true, message: `请上传${label}` }] : undefined}>
          <Input type="hidden" />
        </Form.Item>
        <Upload
          beforeUpload={() => false}
          maxCount={1}
          fileList={fileList}
          disabled={readonly}
          onRemove={() => {
            form.setFieldValue(name, "");
            return true;
          }}
          onChange={({ fileList: nextFileList }) => {
            const latestFile = nextFileList[nextFileList.length - 1];
            form.setFieldValue(name, latestFile?.name ?? "");
          }}
        >
          {!readonly ? <Button>上传文件</Button> : null}
        </Upload>
        {!currentValue ? <Typography.Text type="secondary">{placeholder}</Typography.Text> : null}
      </Form.Item>
    );
  }

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
      title: "供货价格",
      dataIndex: "price",
      width: 220,
      render: (_: unknown, row: HospitalContractProduct, index: number) => {
        const currentPrice = Number(form.getFieldValue(["products", index, "price"]) ?? row.price ?? row.suggestedPrice ?? 0);
        const hint = getSupplyPriceHint(currentPrice, row.suggestedPrice);

        if (readonly) {
          return (
            <Space direction="vertical" size={4}>
              <span>{`¥ ${currentPrice.toFixed(2)}`}</span>
              {hint ? <Typography.Text style={{ color: "rgba(0, 0, 0, 0.88)" }}>{hint}</Typography.Text> : null}
            </Space>
          );
        }

        return (
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            <Form.Item
              name={["products", index, "price"]}
              noStyle
              rules={[{ required: true, message: "请输入供货价格" }]}
            >
              <InputNumber min={0} precision={2} style={{ width: "100%" }} placeholder="请输入供货价格" />
            </Form.Item>
            {hint ? <Typography.Text style={{ color: "rgba(0, 0, 0, 0.88)" }}>{hint}</Typography.Text> : null}
          </Space>
        );
      },
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
                  const nextProducts = [...productItems];
                  nextProducts.splice(index, 1);
                  form.setFieldValue("products", nextProducts);
                  form.setFieldsValue({ products: nextProducts });
                  setProductItems(nextProducts);
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
    const actionType = getSubmitAction(mode, record?.latestActionType);
    if (values.products.length === 0) {
      void message.error("请至少添加一个产品。");
      return;
    }
    setSubmitting(true);
    try {
      await submitHospitalContractAction(values, actionType, actor, detailId === "new" ? undefined : detailId);
      void message.success(`${actionType}已提交审批。`);
      navigate(effectiveBackPath);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCloseContract() {
    if (!record) {
      return;
    }

    let confirmModal: ReturnType<typeof modal.confirm>;
    confirmModal = modal.confirm({
      title: "确认关闭合同？",
      content: (
        <Space direction="vertical" size={12}>
          <span>确认发起关闭后，合同将直接关闭。关闭后的合同无法再进行续签、补充SKU等操作。</span>
          <Checkbox onChange={(event) => confirmModal.update({ okButtonProps: { disabled: !event.target.checked } })}>
            我已阅读并确认关闭后不可恢复
          </Checkbox>
        </Space>
      ),
      okText: "确认关闭",
      cancelText: "取消",
      okButtonProps: { disabled: true },
      onOk: async () => {
        await triggerContractClose(record.id, actor);
        void message.success("合同已关闭。");
        navigate(effectiveBackPath);
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

    const nextProducts = selectedProducts.map((item) => ({
        id: item.id,
        productCode: item.productCode,
        productName: item.productName,
        suggestedPrice: item.suggestedPrice,
        price: item.suggestedPrice,
      }));
    form.setFieldValue("products", nextProducts);
    form.setFieldsValue({ products: nextProducts });
    setProductItems(nextProducts);
    setProductPickerOpen(false);
  }

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card">
        <div className="agreement-detail__header">
          <Space align="center" size={12}>
            <Button onClick={() => navigate(effectiveBackPath)}>返回列表</Button>
            <Typography.Title level={4} className="agreement-detail__title">
              {title}
            </Typography.Title>
            {record ? <Tag color={record.lifeStatus === "有效" ? "success" : record.lifeStatus === "待生效" ? "processing" : record.lifeStatus === "失效" ? "warning" : "default"}>{record.lifeStatus}</Tag> : null}
          </Space>
          <Space>
            {!readonly ? (
              <Button type="primary" loading={submitting} onClick={() => void handleSubmit()}>
                提交
              </Button>
            ) : null}
            {readonly && record && (canRenew(record) || canSupplement(record)) ? (
              <>
                {canRenew(record) ? <Button onClick={() => navigate(`${backPath}/detail/${record.id}`, { state: { mode: "renew" satisfies DetailMode, returnPath: effectiveBackPath } })}>续签</Button> : null}
                {canSupplement(record) ? <Button onClick={() => navigate(`${backPath}/detail/${record.id}`, { state: { mode: "supplement" satisfies DetailMode, returnPath: effectiveBackPath } })}>补充 SKU</Button> : null}
              </>
            ) : null}
            {readonly && record && canClose(record) ? <Button danger onClick={handleCloseContract}>关闭合同</Button> : null}
          </Space>
        </div>
      </Card>

      {record ? (
        <Card className="page-card">
          <Descriptions column={4} size="small">
            <Descriptions.Item label="合同ID">{record.contractId}</Descriptions.Item>
            <Descriptions.Item label="合同编号">{record.contractNo}</Descriptions.Item>
            <Descriptions.Item label="提交人">{record.submitterName}</Descriptions.Item>
            <Descriptions.Item label="提交时间">{record.createdAt}</Descriptions.Item>
            <Descriptions.Item label="当前节点">{record.currentApprovalNode ?? "-"}</Descriptions.Item>
          </Descriptions>
        </Card>
      ) : null}

      <Form form={form} layout="vertical" disabled={readonly}>
        <Space direction="vertical" size={20} style={{ width: "100%" }}>
        <Card className="page-card" title="经销商信息">
          {renderTwoColumnFields([
            <Form.Item name="dealerCode" label="经销商编码" rules={[{ required: true, message: "请输入经销商编码" }]}>
              <Input placeholder="请输入经销商编码" disabled={dealerLocked} />
            </Form.Item>,
            <Form.Item name="dealerName" label="经销商名称" rules={[{ required: true, message: "请输入经销商名称" }]}>
              <Input placeholder="请输入经销商名称" disabled={dealerLocked} />
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
            <Form.Item name="dmsHospitalAddress" label="DMS医院地址" rules={[{ required: true, message: "请输入DMS医院地址" }]}>
              <Input placeholder="请输入DMS医院地址" />
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
            <Form.Item name="deliveryAddress" label="医院收货地址" rules={[{ required: true, message: "请输入医院收货地址" }]}>
              <Input placeholder="请输入医院收货地址" />
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

        {showThirdPartySection ? (
          <Card className="page-card" title="第三方授权信息">
            {renderTwoColumnFields([
              <Form.Item name="authorizationMode" label="医院指定第三方采购授权方式" rules={[{ required: true, message: "请选择授权方式" }]}>
                <Select
                  placeholder="请选择授权方式"
                  options={[
                    { label: "医院授权第三方", value: "医院授权第三方" },
                    { label: "医院指定收货人", value: "医院指定收货人" },
                  ]}
                />
              </Form.Item>,
              <Form.Item name="thirdPartyCompanyEstablishedAt" label="三方公司成立时间" rules={[{ required: true, message: "请选择三方公司成立时间" }]}>
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>,
              <Form.Item name="authorizationEffectiveAt" label="授权书生效时间" rules={[{ required: true, message: "请选择授权书生效时间" }]}>
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>,
              <Form.Item name="authorizationExpiredAt" label="授权书失效时间" rules={[{ required: true, message: "请选择授权书失效时间" }]}>
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>,
              renderUploadField("thirdPartyBusinessLicenseName", "医院指定三方公司营业执照", "请上传医院指定三方公司营业执照", true),
              renderUploadField("thirdPartyFoodQualificationName", "医院指定三方公司食品经营资质", "请上传医院指定三方公司食品经营资质", true),
              renderUploadField("hospitalAuthorizationLetterName", "医院指定三方公司医院授权书", "请上传医院指定三方公司医院授权书", true),
            ])}
          </Card>
        ) : null}

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
          <Table
            rowKey="key"
            pagination={false}
            dataSource={receiverRows}
            tableLayout="fixed"
            scroll={{ x: 960 }}
            columns={[
              { title: "序号", dataIndex: "key", width: 80 },
              {
                title: "收货人姓名",
                dataIndex: "receiverName",
                render: (_: unknown, row: { index: number }) => (
                  <Form.Item
                    name={["receivers", row.index, "receiverName"]}
                    noStyle
                    rules={[{ required: true, message: "请输入收货人姓名" }]}
                  >
                    <Input placeholder="请输入收货人姓名" />
                  </Form.Item>
                ),
              },
              {
                title: "收货人ID",
                dataIndex: "receiverCode",
                render: (_: unknown, row: { index: number }) => (
                  <Form.Item
                    name={["receivers", row.index, "receiverCode"]}
                    noStyle
                    rules={[{ required: true, message: "请输入收货人ID" }]}
                  >
                    <Input placeholder="请输入收货人ID" />
                  </Form.Item>
                ),
              },
            ]}
          />
          {showThirdPartySection ? (
            <Form.Item
              name="authorizedReceiver"
              label="医院授权第三方采购公司的指定收货人"
              style={{ marginTop: 16 }}
            >
              <Input placeholder="请输入医院授权第三方采购公司的指定收货人" />
            </Form.Item>
          ) : null}
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
            <Form.Item name="thirdPartyEffectiveAt" label="第三方生效时间">
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
          <Typography.Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
            至少添加一个产品。
          </Typography.Text>
          <Table
            rowKey="id"
            pagination={false}
            tableLayout="fixed"
            columns={productColumns}
            dataSource={productTableData}
            locale={{ emptyText: "请先添加产品" }}
            scroll={{ x: 920 }}
          />
        </Card>

        <Card className="page-card" title="合同附件信息">
          {renderUploadField("contractAttachmentName", "合同附件", "请上传合同附件", true)}
        </Card>
        </Space>
      </Form>

      {readonly && record ? (
        <>
          <Card className="page-card" title="合同版本管理记录">
            <Table
              rowKey="id"
              pagination={false}
              tableLayout="fixed"
              scroll={{ x: 1380 }}
              dataSource={versionRows}
              columns={[
                {
                  title: "版本号",
                  dataIndex: "versionLabel",
                  width: 130,
                  render: (value: string, row: { status: string }) => (
                    <Space>
                      <span>{value}</span>
                      {row.status === "生效中" ? <Tag color="blue">当前版本</Tag> : null}
                    </Space>
                  ),
                },
                { title: "修改日期", dataIndex: "createdAt", width: 180 },
                { title: "修改人", dataIndex: "operatorName", width: 120 },
                { title: "签署时间", dataIndex: "signedAt", width: 120 },
                { title: "到期时间", dataIndex: "expiredAt", width: 120 },
                { title: "变更内容", dataIndex: "changeContent", width: 280 },
                {
                  title: "状态",
                  dataIndex: "status",
                  width: 120,
                  render: (value: string) => <Tag color={value === "生效中" ? "success" : "default"}>{value}</Tag>,
                },
                { title: "合同文件", dataIndex: "contractFileName", width: 240 },
                {
                  title: "操作",
                  key: "actions",
                  width: 160,
                  render: (_, row: any) => (
                    <Space size={4}>
                      <Button type="link" onClick={() => exportHospitalVersionNotice(row.contractFileName, message)}>
                        下载合同文件
                      </Button>
                      <Button type="link" onClick={() => void message.info(`查看 ${row.versionLabel} 版本详情`)}>查看详情</Button>
                    </Space>
                  ),
                },
              ]}
            />
          </Card>

          <Card className="page-card" title="合同修改日志">
            <Table
              rowKey="id"
              tableLayout="fixed"
              dataSource={modificationLogs}
              scroll={{ x: 1080 }}
              pagination={{ pageSize: 5, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
              columns={[
                { title: "操作时间", dataIndex: "actedAt", width: 180 },
                { title: "操作人", dataIndex: "operatorName", width: 140 },
                { title: "变更内容/审批备注", dataIndex: "detail", width: 520 },
                {
                  title: "操作",
                  dataIndex: "actionLabel",
                  width: 120,
                  render: (value: string) => (
                    <Button type="link" onClick={() => void message.info(`${value}日志详情已在审批记录中展示。`)}>
                      查看详情
                    </Button>
                  ),
                },
              ]}
            />
          </Card>
        </>
      ) : null}

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
