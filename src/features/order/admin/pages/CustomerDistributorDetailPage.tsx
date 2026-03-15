import {
  App,
  Button,
  Card,
  Cascader,
  DatePicker,
  Descriptions,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../../auth/useAuth";
import {
  businessUnitOptions,
  channelOptions,
  cityMasterOptions,
  cooperationStatusOptions,
  getCustomerDistributorById,
  getCustomerDistributorDisplayStatus,
  regionOptions,
  saveCustomerDistributor,
  streetOptions,
  submitCustomerDistributor,
  type CustomerDistributorRecord,
  type DistributorFormValues,
  type SupplyRelation,
} from "./CustomerDistributor.shared";

type FormSupplyRelation = {
  id?: string;
  dealerType: string;
  dealerCode: string;
  dealerName: string;
  shipToCode: string;
  shipToName: string;
  cooperationStatus: string;
  cooperationStartDate?: Dayjs;
  cooperationEndDate?: Dayjs;
};

export function CustomerDistributorDetailPage() {
  const [form] = Form.useForm<DistributorFormValues>();
  const { message, modal } = App.useApp();
  const { user } = useAuth();
  const { detailId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const mode = new URLSearchParams(location.search).get("mode") ?? "view";
  const isCreate = detailId === "new";
  const isView = mode === "view";
  const [activeBusinessUnitIndex, setActiveBusinessUnitIndex] = useState(0);
  const [businessUnitSelectorOpen, setBusinessUnitSelectorOpen] = useState(false);
  const [pendingBusinessUnit, setPendingBusinessUnit] = useState<string>();
  const watchedBusinessUnits = Form.useWatch("businessUnits", form) ?? [];

  const record = useMemo(() => (isCreate || !detailId ? null : getCustomerDistributorById(detailId)), [detailId, isCreate]);
  const displayStatus = useMemo(
    () => (record ? getCustomerDistributorDisplayStatus(record) : isCreate ? "草稿" : undefined),
    [isCreate, record],
  );

  useEffect(() => {
    if (isCreate) {
      form.setFieldsValue({
        provinceCityDistrict: ["北京市", "北京市", "朝阳区"],
        street: "望京街道",
        businessUnit: "干货",
        channelName: "现代渠道",
        isKeyCustomer: false,
        cityMaster: "北京",
        businessUnits: [
          {
            businessUnit: "干货",
            channelName: "现代渠道",
            isKeyCustomer: false,
            cityMaster: "北京",
            eSignName: "",
            eSignPhone: "",
            supplyRelations: [],
          },
        ],
      });
      return;
    }

    if (!record) {
      return;
    }

    form.setFieldsValue({
      distributorCode: record.distributorCode,
      socialCreditCode: record.socialCreditCode,
      distributorName: record.distributorName,
      ownerName: record.ownerName,
      ownerPhone: record.ownerPhone,
      ownerEmail: record.ownerEmail,
      companyType: record.companyType,
      legalRepresentative: record.legalRepresentative,
      provinceCityDistrict: record.provinceCityDistrict,
      street: record.street,
      companyAddress: record.companyAddress,
      businessUnit: record.businessUnit,
      channelName: record.channelName,
      isKeyCustomer: record.isKeyCustomer,
      cityMaster: record.cityMaster,
      eSignName: record.eSignName,
      eSignPhone: record.eSignPhone,
      businessUnits: (record.businessUnits?.length
        ? record.businessUnits
        : [
            {
              id: `${record.id}-bu-fallback`,
              businessUnit: record.businessUnit,
              channelName: record.channelName,
              isKeyCustomer: record.isKeyCustomer,
              cityMaster: record.cityMaster,
              eSignName: record.eSignName,
              eSignPhone: record.eSignPhone,
              supplyRelations: record.supplyRelations,
            },
          ]
      ).map((unit) => ({
        ...unit,
        supplyRelations: unit.supplyRelations.map((item) => ({
          ...item,
          cooperationStartDate: item.cooperationStartDate ? dayjs(item.cooperationStartDate) : undefined,
          cooperationEndDate: item.cooperationEndDate ? dayjs(item.cooperationEndDate) : undefined,
        })),
      })),
    });
  }, [form, isCreate, record]);

  function buildRecord(values: DistributorFormValues): CustomerDistributorRecord {
    const now = dayjs().format("YYYY-MM-DD HH:mm");
    const businessUnits = values.businessUnits ?? [];
    const primaryBusinessUnit = businessUnits[0];

    return {
      id: record?.id ?? `customer-distributor-${Date.now()}`,
      distributorCode: values.distributorCode,
      distributorName: values.distributorName,
      socialCreditCode: values.socialCreditCode,
      ownerName: values.ownerName,
      ownerPhone: values.ownerPhone,
      ownerEmail: values.ownerEmail,
      companyType: record?.companyType ?? "企业",
      legalRepresentative: record?.legalRepresentative ?? values.ownerName,
      provinceCityDistrict: values.provinceCityDistrict,
      street: values.street,
      companyAddress: values.companyAddress,
      businessUnit: primaryBusinessUnit?.businessUnit ?? "",
      channelName: primaryBusinessUnit?.channelName ?? "",
      isKeyCustomer: primaryBusinessUnit?.isKeyCustomer ?? false,
      cityMaster: primaryBusinessUnit?.cityMaster ?? "",
      eSignName: primaryBusinessUnit?.eSignName ?? "",
      eSignPhone: primaryBusinessUnit?.eSignPhone ?? "",
      createdAt: record?.createdAt ?? now,
      updatedAt: now,
      status: record?.status ?? "停用",
      approvalStatus: record?.approvalStatus ?? "草稿",
      submittedAt: record?.submittedAt,
      approvalHistory: record?.approvalHistory ?? [],
      supplyRelations: (primaryBusinessUnit?.supplyRelations ?? []).map((item, index) => ({
        id: item.id ?? record?.supplyRelations[index]?.id ?? `relation-${Date.now()}-${index}`,
        dealerType: item.dealerType,
        dealerCode: item.dealerCode,
        dealerName: item.dealerName,
        shipToCode: item.shipToCode,
        shipToName: item.shipToName,
        cooperationStatus: item.cooperationStatus,
        cooperationStartDate: item.cooperationStartDate?.format("YYYY-MM-DD") ?? "",
        cooperationEndDate: item.cooperationEndDate?.format("YYYY-MM-DD"),
      })),
      businessUnits: businessUnits.map((unit, unitIndex) => ({
        id: unit.id ?? record?.businessUnits?.[unitIndex]?.id ?? `bu-${Date.now()}-${unitIndex}`,
        businessUnit: unit.businessUnit,
        channelName: unit.channelName,
        isKeyCustomer: unit.isKeyCustomer,
        cityMaster: unit.cityMaster,
        eSignName: unit.eSignName,
        eSignPhone: unit.eSignPhone,
        supplyRelations: (unit.supplyRelations ?? []).map((item: FormSupplyRelation, relationIndex: number) => ({
          id:
            item.id ??
            record?.businessUnits?.[unitIndex]?.supplyRelations?.[relationIndex]?.id ??
            `relation-${Date.now()}-${unitIndex}-${relationIndex}`,
          dealerType: item.dealerType,
          dealerCode: item.dealerCode,
          dealerName: item.dealerName,
          shipToCode: item.shipToCode,
          shipToName: item.shipToName,
          cooperationStatus: item.cooperationStatus,
          cooperationStartDate: item.cooperationStartDate?.format("YYYY-MM-DD") ?? "",
          cooperationEndDate: item.cooperationEndDate?.format("YYYY-MM-DD"),
        })),
      })),
    };
  }

  async function handleSave() {
    const values = await form.validateFields();
    const nextRecord = buildRecord(values);
    const approvalStatus =
      record?.approvalStatus === "已驳回" ? "已驳回" : record?.approvalStatus === "已通过" ? "已通过" : "草稿";

    saveCustomerDistributor({
      ...nextRecord,
      approvalStatus,
    });
    void message.success("分销商信息已保存。");
    navigate("/admin/order/distributor-list");
  }

  async function handleSubmit() {
    if (!user) {
      return;
    }

    const values = await form.validateFields();
    const nextRecord = buildRecord(values);

    modal.confirm({
      title: record?.approvalStatus === "已驳回" ? "确认重新提交审批？" : "确认提交审批？",
      content: "提交后将进入分销商审批列表，待审批通过后自动变更为启用状态。",
      okText: "确认提交",
      cancelText: "取消",
      onOk: async () => {
        submitCustomerDistributor({
          record: nextRecord,
          account: user.account,
          operatorName: user.name,
          remark: record?.approvalStatus === "已驳回" ? "驳回后重新提交审批" : "新建分销商提交审批",
        });
        void message.success("已提交至分销商审批。");
        navigate("/admin/order/distributor-approval");
      },
    });
  }

  const relationColumns: ColumnsType<SupplyRelation> = [
    { title: "经销商类型", dataIndex: "dealerType", width: 120 },
    { title: "经销商编码", dataIndex: "dealerCode", width: 140 },
    { title: "经销商名称", dataIndex: "dealerName", width: 180 },
    { title: "ShipTo编码", dataIndex: "shipToCode", width: 140 },
    { title: "ShipTo名称", dataIndex: "shipToName", width: 160 },
    { title: "是否合作", dataIndex: "cooperationStatus", width: 120 },
    { title: "合作开始时间", dataIndex: "cooperationStartDate", width: 140 },
    { title: "合作结束时间", dataIndex: "cooperationEndDate", width: 140, render: (value?: string) => value || "-" },
  ];

  const title = isCreate ? "新增分销商" : mode === "edit" ? "编辑分销商" : "分销商详情";
  const availableBusinessUnitOptions = businessUnitOptions.filter(
    (item) => !watchedBusinessUnits.some((unit) => unit?.businessUnit === item),
  );
  const canSubmit = !isView && (isCreate || record?.approvalStatus === "草稿" || record?.approvalStatus === "已驳回");

  if (!isCreate && !record) {
    return (
      <Card className="page-card">
        <Typography.Text>未找到当前分销商记录。</Typography.Text>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card">
        <div className="agreement-detail__header">
          <Space align="center" size={12}>
            <Button onClick={() => navigate("/admin/order/distributor-list")}>返回列表</Button>
            <Space align="center" size={12}>
              <Typography.Title level={4} className="agreement-detail__title">
                {title}
              </Typography.Title>
              {displayStatus ? <Tag color={displayStatus === "启用" ? "success" : displayStatus === "待审批" ? "processing" : displayStatus === "已驳回" ? "error" : "default"}>{displayStatus}</Tag> : null}
            </Space>
          </Space>
          {isView ? null : (
            <Space>
              <Button onClick={() => navigate("/admin/order/distributor-list")}>取消</Button>
              <Button onClick={() => void handleSave()}>保存</Button>
              {canSubmit ? (
                <Button type="primary" onClick={() => void handleSubmit()}>
                  {record?.approvalStatus === "已驳回" ? "重新提交" : "提交"}
                </Button>
              ) : null}
            </Space>
          )}
        </div>
      </Card>

      <Form form={form} layout="vertical" disabled={isView}>
        <Space direction="vertical" size={16} className="page-stack">
          <Card className="page-card customer-distributor-detail__card customer-distributor-detail__card--base" title="基础信息">
            <div className="customer-distributor-detail__grid customer-distributor-detail__grid--two">
              <Form.Item
                name="distributorCode"
                label="雀巢分销商编码"
                rules={[{ required: true, message: "请输入雀巢分销商编码" }]}
              >
                <Input
                  placeholder="输入雀巢分销商编码"
                  addonAfter={
                    isView ? null : (
                      <Button
                        type="link"
                        className="customer-distributor-detail__lookup-btn"
                        onClick={() => void form.validateFields(["distributorCode"])}
                      >
                        查询
                      </Button>
                    )
                  }
                />
              </Form.Item>
              <Form.Item name="socialCreditCode" label="统一社会信用代码" rules={[{ required: true, message: "请输入统一社会信用代码" }]}>
                <Input placeholder="输入统一社会信用代码" />
              </Form.Item>
              <Form.Item name="distributorName" label="分销商名称" rules={[{ required: true, message: "请输入分销商名称" }]}>
                <Input placeholder="输入分销商名称" />
              </Form.Item>
              <Form.Item name="ownerName" label="负责人名称" rules={[{ required: true, message: "请输入负责人名称" }]}>
                <Input placeholder="输入负责人名称" />
              </Form.Item>
              <Form.Item
                name="ownerPhone"
                label="负责人电话"
                rules={[
                  { required: true, message: "请输入负责人电话" },
                  { pattern: /^1\d{10}$/, message: "请输入正确的手机号" },
                ]}
              >
                <Input placeholder="输入负责人电话" />
              </Form.Item>
              <Form.Item
                name="ownerEmail"
                label="负责人邮箱"
                rules={[
                  { required: true, message: "请输入负责人邮箱" },
                  { type: "email", message: "请输入正确的邮箱地址" },
                ]}
              >
                <Input placeholder="输入负责人邮箱" />
              </Form.Item>
              <div className="customer-distributor-detail__inline-group">
                <Form.Item
                  className="customer-distributor-detail__inline-group-main"
                  name="provinceCityDistrict"
                  label="省市区"
                  rules={[{ required: true, message: "请选择省市区" }]}
                >
                  <Cascader options={regionOptions} placeholder="请选择省市区" />
                </Form.Item>
                <Form.Item
                  className="customer-distributor-detail__inline-group-side"
                  name="street"
                  label="街道"
                  rules={[{ required: true, message: "请选择街道" }]}
                >
                  <Select placeholder="选择街道" options={streetOptions} />
                </Form.Item>
              </div>
              <Form.Item name="companyAddress" label="企业地址" rules={[{ required: true, message: "请输入企业地址" }]}>
                <Input placeholder="输入企业地址" />
              </Form.Item>
            </div>
          </Card>

          <Card className="page-card customer-distributor-detail__card" title="业务单元信息">
            <Form.List name="businessUnits">
              {(fields, { remove }) => {
                const activeField = fields[activeBusinessUnitIndex];
                const activeUnit = watchedBusinessUnits[activeBusinessUnitIndex];

                return (
                  <Space direction="vertical" size={16} style={{ width: "100%" }}>
                    <div className="customer-distributor-detail__bu-tabs">
                      <Space size={12} wrap>
                        {fields.map((field, index) => (
                          <button
                            key={field.key}
                            type="button"
                            className={`customer-distributor-detail__bu-tab${
                              index === activeBusinessUnitIndex ? " is-active" : ""
                            }`}
                            onClick={() => setActiveBusinessUnitIndex(index)}
                          >
                            <span>{watchedBusinessUnits[index]?.businessUnit || `业务单元 ${index + 1}`}</span>
                            {!isView && fields.length > 1 ? (
                              <span
                                className="customer-distributor-detail__bu-tab-close"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  remove(field.name);
                                  setActiveBusinessUnitIndex((current) => (current > 0 ? current - 1 : 0));
                                }}
                              >
                                ×
                              </span>
                            ) : null}
                          </button>
                        ))}
                      </Space>
                      {isView ? null : <Button onClick={() => setBusinessUnitSelectorOpen(true)}>+</Button>}
                    </div>

                    {activeField ? (
                      <>
                        <div className="customer-distributor-detail__section">
                          <Typography.Title level={5} className="customer-distributor-detail__section-title">
                            基础信息
                          </Typography.Title>
                          <div className="customer-distributor-detail__grid customer-distributor-detail__grid--two">
                            <Form.Item
                              name={[activeField.name, "businessUnit"]}
                              label="业务单元"
                              rules={[{ required: true, message: "请选择业务单元" }]}
                            >
                              <Input readOnly />
                            </Form.Item>
                            <Form.Item
                              name={[activeField.name, "channelName"]}
                              label="渠道名称"
                              rules={[{ required: true, message: "请选择渠道名称" }]}
                            >
                              <Select options={channelOptions.map((item) => ({ label: item, value: item }))} />
                            </Form.Item>
                            <Form.Item
                              name={[activeField.name, "cityMaster"]}
                              label="City_Master"
                              rules={[{ required: true, message: "请选择 City_Master" }]}
                            >
                              <Select options={cityMasterOptions.map((item) => ({ label: item, value: item }))} />
                            </Form.Item>
                            <Form.Item
                              name={[activeField.name, "isKeyCustomer"]}
                              label="是否为重点客户"
                              rules={[{ required: true, message: "请选择是否为重点客户" }]}
                            >
                              <Radio.Group>
                                <Radio value>是</Radio>
                                <Radio value={false}>否</Radio>
                              </Radio.Group>
                            </Form.Item>
                            <Form.Item
                              name={[activeField.name, "eSignName"]}
                              label="电签人姓名"
                              rules={[{ required: true, message: "请输入电签人姓名" }]}
                            >
                              <Input placeholder="输入电签人姓名" />
                            </Form.Item>
                            <Form.Item
                              name={[activeField.name, "eSignPhone"]}
                              label="电签人电话"
                              rules={[
                                { required: true, message: "请输入电签人电话" },
                                { pattern: /^1\d{10}$/, message: "请输入正确的手机号" },
                              ]}
                            >
                              <Input placeholder="输入电签人电话" />
                            </Form.Item>
                          </div>
                        </div>

                        <div className="customer-distributor-detail__section">
                          <div className="customer-distributor-detail__section-header">
                            <Typography.Title level={5} className="customer-distributor-detail__section-title">
                              经销商供货关系
                            </Typography.Title>
                            {isView ? null : (
                              <Button
                                type="primary"
                                onClick={() => {
                                  const next = [...watchedBusinessUnits];
                                  const currentUnit = next[activeBusinessUnitIndex];
                                  if (!currentUnit) {
                                    return;
                                  }
                                  currentUnit.supplyRelations = [
                                    ...(currentUnit.supplyRelations ?? []),
                                    {
                                      dealerType: "经销商",
                                      dealerCode: "",
                                      dealerName: "",
                                      shipToCode: "",
                                      shipToName: "",
                                      cooperationStatus: "合作中",
                                    },
                                  ];
                                  form.setFieldValue("businessUnits", next);
                                }}
                              >
                                新增供货关系
                              </Button>
                            )}
                          </div>

                          {isView ? (
                            <Table
                              rowKey="id"
                              dataSource={(record?.businessUnits?.[activeBusinessUnitIndex]?.supplyRelations ??
                                activeUnit?.supplyRelations ??
                                []) as SupplyRelation[]}
                              columns={relationColumns}
                              pagination={false}
                              tableLayout="fixed"
                              scroll={{ x: 1200 }}
                            />
                          ) : (activeUnit?.supplyRelations?.length ?? 0) === 0 ? (
                            <Typography.Text type="secondary">暂无供货关系</Typography.Text>
                          ) : (
                            <div className="customer-distributor-detail__editable-table">
                              <div className="customer-distributor-detail__editable-row customer-distributor-detail__editable-row--head">
                                <div>经销商类型</div>
                                <div>经销商编码</div>
                                <div>经销商名称</div>
                                <div>ShipTo编码</div>
                                <div>ShipTo名称</div>
                                <div>是否合作</div>
                                <div>合作开始时间</div>
                                <div>合作结束时间</div>
                                <div>操作</div>
                              </div>
                              {(activeUnit?.supplyRelations ?? []).map((_, relationIndex) => (
                                <div key={`${activeField.key}-${relationIndex}`} className="customer-distributor-detail__editable-row">
                                  <Form.Item name={[activeField.name, "supplyRelations", relationIndex, "dealerType"]} rules={[{ required: true, message: "请选择经销商类型" }]}>
                                    <Select options={[{ label: "经销商", value: "经销商" }, { label: "DT经销商", value: "DT经销商" }]} />
                                  </Form.Item>
                                  <Form.Item name={[activeField.name, "supplyRelations", relationIndex, "dealerCode"]} rules={[{ required: true, message: "请输入经销商编码" }]}>
                                    <Input placeholder="输入经销商编码" />
                                  </Form.Item>
                                  <Form.Item name={[activeField.name, "supplyRelations", relationIndex, "dealerName"]} rules={[{ required: true, message: "请输入经销商名称" }]}>
                                    <Input placeholder="输入经销商名称" />
                                  </Form.Item>
                                  <Form.Item name={[activeField.name, "supplyRelations", relationIndex, "shipToCode"]} rules={[{ required: true, message: "请输入 ShipTo 编码" }]}>
                                    <Input placeholder="输入 ShipTo 编码" />
                                  </Form.Item>
                                  <Form.Item name={[activeField.name, "supplyRelations", relationIndex, "shipToName"]} rules={[{ required: true, message: "请输入 ShipTo 名称" }]}>
                                    <Input placeholder="输入 ShipTo 名称" />
                                  </Form.Item>
                                  <Form.Item name={[activeField.name, "supplyRelations", relationIndex, "cooperationStatus"]} rules={[{ required: true, message: "请选择合作状态" }]}>
                                    <Select options={cooperationStatusOptions.map((item) => ({ label: item, value: item }))} />
                                  </Form.Item>
                                  <Form.Item name={[activeField.name, "supplyRelations", relationIndex, "cooperationStartDate"]} rules={[{ required: true, message: "请选择合作开始时间" }]}>
                                    <DatePicker style={{ width: "100%" }} />
                                  </Form.Item>
                                  <Form.Item name={[activeField.name, "supplyRelations", relationIndex, "cooperationEndDate"]}>
                                    <DatePicker style={{ width: "100%" }} />
                                  </Form.Item>
                                  <div className="customer-distributor-detail__editable-action">
                                    <Button
                                      type="link"
                                      danger
                                      onClick={() => {
                                        const next = [...watchedBusinessUnits];
                                        const currentUnit = next[activeBusinessUnitIndex];
                                        if (!currentUnit) {
                                          return;
                                        }
                                        currentUnit.supplyRelations = currentUnit.supplyRelations.filter((__, idx) => idx !== relationIndex);
                                        form.setFieldValue("businessUnits", next);
                                      }}
                                    >
                                      删除
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    ) : null}
                  </Space>
                );
              }}
            </Form.List>
          </Card>

          {isView && record ? (
            <Card className="page-card" title="系统信息">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="创建时间">{record.createdAt}</Descriptions.Item>
                <Descriptions.Item label="更新时间">{record.updatedAt}</Descriptions.Item>
              </Descriptions>
            </Card>
          ) : null}
        </Space>
      </Form>

      <Modal
        title="选择业务单元"
        open={businessUnitSelectorOpen}
        onCancel={() => {
          setBusinessUnitSelectorOpen(false);
          setPendingBusinessUnit(undefined);
        }}
        onOk={() => {
          if (!pendingBusinessUnit) {
            return;
          }

          const next = [
            ...watchedBusinessUnits,
            {
              businessUnit: pendingBusinessUnit,
              channelName: "",
              isKeyCustomer: false,
              cityMaster: "",
              eSignName: "",
              eSignPhone: "",
              supplyRelations: [],
            },
          ];
          form.setFieldValue("businessUnits", next);
          setActiveBusinessUnitIndex(next.length - 1);
          setBusinessUnitSelectorOpen(false);
          setPendingBusinessUnit(undefined);
        }}
        okText="确认选择"
        cancelText="取消"
      >
        <Radio.Group
          value={pendingBusinessUnit}
          onChange={(event) => setPendingBusinessUnit(event.target.value)}
          className="customer-distributor-detail__unit-picker"
        >
          {availableBusinessUnitOptions.map((item) => (
            <Radio key={item} value={item}>
              {item}
            </Radio>
          ))}
        </Radio.Group>
      </Modal>
    </Space>
  );
}
