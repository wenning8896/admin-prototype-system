import { InboxOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  Radio,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  Upload,
} from "antd";
import type { UploadProps } from "antd";
import { useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { recordEDistributorCertification } from "../features/order/admin/services/eDistributorList.mock-service";

type CertificationIdentity = "dealer" | "distributor" | "e-distributor";
type CompanyType = "enterprise" | "individual-business";

type CertificationFormValues = {
  certificationIdentity: CertificationIdentity;
  companyType: CompanyType;
  companyName: string;
  companyShortName: string;
  socialCreditCode: string;
  legalRepresentative: string;
  cityRegion: string;
  address: string;
  businessLicense: string[];
  productScopes: string[];
  eSignName: string;
  eSignPhone: string;
  businessName: string;
  businessPhone: string;
  contractManagerName: string;
  contractManagerPhone: string;
  warehouseContactName: string;
  warehouseContactPhone: string;
  receivingAddressList: string;
  settlementAccountName: string;
  settlementBankName: string;
  settlementBankAccount: string;
  channelManagerName: string;
  channelManagerPhone: string;
  shopOperatorName: string;
  shopOperatorPhone: string;
  inventoryManagerName: string;
  inventoryManagerPhone: string;
};

const productOptions = ["奶品", "咖啡", "糖果", "RTD", "星巴克"];
const cityOptions = [
  { label: "上海市 / 浦东新区", value: "上海市 / 浦东新区" },
  { label: "北京市 / 朝阳区", value: "北京市 / 朝阳区" },
  { label: "广州市 / 天河区", value: "广州市 / 天河区" },
  { label: "成都市 / 高新区", value: "成都市 / 高新区" },
];

const identityOptions = [
  {
    label: "经销商",
    value: "dealer" satisfies CertificationIdentity,
    description: "适用于合同签署、医院签收和基础主体认证。",
  },
  {
    label: "分销商",
    value: "distributor" satisfies CertificationIdentity,
    description: "适用于分销协同、收货地址、库存和店铺管理。",
  },
  {
    label: "E分销平台分销商",
    value: "e-distributor" satisfies CertificationIdentity,
    description: "适用于 E 分销平台签约、下单、OffTake 和电签授权。",
  },
];

function PhoneRule(requiredMessage: string) {
  return [
    { required: true, message: requiredMessage },
    { pattern: /^1\d{10}$/, message: "请输入正确的手机号" },
  ];
}

export function CertificationPage() {
  const [form] = Form.useForm<CertificationFormValues>();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const account = searchParams.get("account") ?? location.state?.account;
  const role = searchParams.get("role") ?? location.state?.role;
  const email = searchParams.get("email") ?? location.state?.email;
  const certificationIdentity = Form.useWatch("certificationIdentity", form) ?? "e-distributor";

  const uploadProps: UploadProps = useMemo(
    () => ({
      multiple: false,
      beforeUpload(file) {
        setUploadedFiles([file.name]);
        form.setFieldValue("businessLicense", [file.name]);
        return false;
      },
      fileList: uploadedFiles.map((name, index) => ({
        uid: `${index}`,
        name,
        status: "done" as const,
      })),
      onRemove() {
        setUploadedFiles([]);
        form.setFieldValue("businessLicense", []);
      },
    }),
    [form, uploadedFiles],
  );

  async function handleFinish(values: CertificationFormValues) {
    setSubmitting(true);
    setError(null);

    try {
      if (values.certificationIdentity === "e-distributor") {
        await recordEDistributorCertification({
          companyName: values.companyName,
          companyType: values.companyType,
          socialCreditCode: values.socialCreditCode,
          legalRepresentative: values.legalRepresentative,
          phone: account ?? values.eSignPhone ?? values.businessPhone,
          eSignName: values.eSignName,
          businessOwnerName: values.businessName,
          email: email ?? "",
          productScopes: values.productScopes,
        });
      }

      await new Promise((resolve) => window.setTimeout(resolve, 800));
      navigate(
        `/login?account=${encodeURIComponent(account ?? values.eSignPhone ?? values.businessPhone)}&role=${encodeURIComponent(role ?? "dealer")}`,
        { replace: true },
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "认证提交失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="certification-page">
      <Card className="certification-card">
        <div className="certification-card__header">
          <Typography.Title level={3}>腾讯电子签平台认证</Typography.Title>
          <Typography.Paragraph className="certification-card__subtitle">
            请先选择认证身份，再完善对应主体资料。认证通过后，将使用注册手机号 <code>{account ?? "-"}</code> 登录系统。
            {email ? <> 当前注册邮箱为 <code>{email}</code>。</> : null}
          </Typography.Paragraph>
        </div>

        {error ? (
          <Alert
            type="error"
            showIcon
            message="提交失败"
            description={error}
            className="login-card__alert"
          />
        ) : null}

        <Form<CertificationFormValues>
          form={form}
          layout="vertical"
          initialValues={{
            certificationIdentity: "e-distributor",
            companyType: "enterprise",
            businessLicense: [],
            productScopes: [],
            eSignPhone: account ?? "",
            businessPhone: account ?? "",
            contractManagerPhone: account ?? "",
            warehouseContactPhone: account ?? "",
            channelManagerPhone: account ?? "",
            shopOperatorPhone: account ?? "",
            inventoryManagerPhone: account ?? "",
          }}
          onFinish={handleFinish}
        >
          <Form.Item<CertificationFormValues>
            label="认证类型"
            name="certificationIdentity"
            rules={[{ required: true, message: "请选择认证类型" }]}
          >
            <Radio.Group className="certification-identity-group">
              <Space direction="vertical" size={12} className="page-stack">
                {identityOptions.map((option) => (
                  <Radio key={option.value} value={option.value}>
                    <div className="certification-identity-option">
                      <div>
                        <Typography.Text strong>{option.label}</Typography.Text>
                        <Typography.Paragraph className="certification-identity-desc">
                          {option.description}
                        </Typography.Paragraph>
                      </div>
                    </div>
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </Form.Item>

          <div className="certification-section">
            <div className="certification-section__head">
              <Typography.Title level={5}>主体信息</Typography.Title>
              <Tag>{identityOptions.find((item) => item.value === certificationIdentity)?.label}</Tag>
            </div>

            <Form.Item<CertificationFormValues>
              label="企业主体类型"
              name="companyType"
              rules={[{ required: true, message: "请选择企业主体类型" }]}
            >
              <Radio.Group>
                <Radio value="enterprise">企业</Radio>
                <Radio value="individual-business">个体工商户</Radio>
              </Radio.Group>
            </Form.Item>

            <Row gutter={[16, 0]}>
              <Col xs={24} md={12}>
                <Form.Item label="企业名称" name="companyName" rules={[{ required: true, message: "请输入企业名称" }]}>
                  <Input placeholder="请输入企业名称" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="名称英文缩写"
                  name="companyShortName"
                  rules={[{ required: true, message: "请输入名称英文缩写" }]}
                >
                  <Input placeholder="请输入企业英文缩写" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="统一社会信用代码"
                  name="socialCreditCode"
                  rules={[{ required: true, message: "请输入统一社会信用代码" }]}
                >
                  <Input placeholder="请输入统一社会信用代码" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="法定代表人"
                  name="legalRepresentative"
                  rules={[{ required: true, message: "请输入法定代表人" }]}
                >
                  <Input placeholder="请输入法人姓名" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="城市及区域"
                  name="cityRegion"
                  rules={[{ required: true, message: "请选择城市及区域" }]}
                >
                  <Select placeholder="请选择省市区" options={cityOptions} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="详细地址" name="address" rules={[{ required: true, message: "请输入详细地址" }]}>
                  <Input placeholder="请输入企业详细地址" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="营业执照"
              name="businessLicense"
              valuePropName="fileList"
              rules={[
                {
                  validator(_, value: string[]) {
                    if (value && value.length > 0) {
                      return Promise.resolve();
                    }

                    return Promise.reject(new Error("请上传营业执照"));
                  },
                },
              ]}
            >
              <Upload.Dragger {...uploadProps} className="certification-upload">
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
                <p className="ant-upload-hint">仅支持 jpg / png 格式图片</p>
              </Upload.Dragger>
            </Form.Item>
          </div>

          {(certificationIdentity === "dealer" || certificationIdentity === "e-distributor") && (
            <div className="certification-section">
              <div className="certification-section__head">
                <Typography.Title level={5}>经营与授权信息</Typography.Title>
              </div>

              <Form.Item
                label="选择经营产品范围"
                name="productScopes"
                rules={[{ required: true, message: "请选择经营产品范围" }]}
              >
                <Checkbox.Group options={productOptions} />
              </Form.Item>

              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="授权电签人姓名(签合同)"
                    name="eSignName"
                    rules={[{ required: true, message: "请输入授权电签人姓名" }]}
                  >
                    <Input placeholder="请输入电签人姓名" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="授权电签人手机号(签合同)"
                    name="eSignPhone"
                    rules={PhoneRule("请输入授权电签人手机号")}
                  >
                    <Input placeholder="请输入电签人手机号" />
                  </Form.Item>
                </Col>
              </Row>

              {certificationIdentity === "dealer" ? (
                <Row gutter={[16, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="合同管理员姓名"
                      name="contractManagerName"
                      rules={[{ required: true, message: "请输入合同管理员姓名" }]}
                    >
                      <Input placeholder="请输入合同管理员姓名" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="合同管理员手机号"
                      name="contractManagerPhone"
                      rules={PhoneRule("请输入合同管理员手机号")}
                    >
                      <Input placeholder="请输入合同管理员手机号" />
                    </Form.Item>
                  </Col>
                </Row>
              ) : null}

              {certificationIdentity === "e-distributor" ? (
                <Row gutter={[16, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="授权业务人姓名(小程序下单)"
                      name="businessName"
                      rules={[{ required: true, message: "请输入授权业务人姓名" }]}
                    >
                      <Input placeholder="请输入业务人姓名" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="授权业务人手机号(小程序下单)"
                      name="businessPhone"
                      rules={PhoneRule("请输入授权业务人手机号")}
                    >
                      <Input placeholder="请输入业务人手机号" />
                    </Form.Item>
                  </Col>
                </Row>
              ) : null}
            </div>
          )}

          {certificationIdentity === "distributor" && (
            <div className="certification-section">
              <div className="certification-section__head">
                <Typography.Title level={5}>分销协同信息</Typography.Title>
              </div>

              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="收货地址列表说明"
                    name="receivingAddressList"
                    rules={[{ required: true, message: "请输入收货地址列表说明" }]}
                  >
                    <Input.TextArea rows={4} placeholder="请输入收货地址、仓库、联系人等信息" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="结算户名"
                    name="settlementAccountName"
                    rules={[{ required: true, message: "请输入结算户名" }]}
                  >
                    <Input placeholder="请输入结算户名" />
                  </Form.Item>
                  <Form.Item
                    label="开户银行"
                    name="settlementBankName"
                    rules={[{ required: true, message: "请输入开户银行" }]}
                  >
                    <Input placeholder="请输入开户银行" />
                  </Form.Item>
                  <Form.Item
                    label="银行账号"
                    name="settlementBankAccount"
                    rules={[{ required: true, message: "请输入银行账号" }]}
                  >
                    <Input placeholder="请输入银行账号" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="渠道负责人姓名"
                    name="channelManagerName"
                    rules={[{ required: true, message: "请输入渠道负责人姓名" }]}
                  >
                    <Input placeholder="请输入渠道负责人姓名" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="渠道负责人手机号"
                    name="channelManagerPhone"
                    rules={PhoneRule("请输入渠道负责人手机号")}
                  >
                    <Input placeholder="请输入渠道负责人手机号" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="店铺运营人姓名"
                    name="shopOperatorName"
                    rules={[{ required: true, message: "请输入店铺运营人姓名" }]}
                  >
                    <Input placeholder="请输入店铺运营人姓名" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="店铺运营人手机号"
                    name="shopOperatorPhone"
                    rules={PhoneRule("请输入店铺运营人手机号")}
                  >
                    <Input placeholder="请输入店铺运营人手机号" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="库存负责人姓名"
                    name="inventoryManagerName"
                    rules={[{ required: true, message: "请输入库存负责人姓名" }]}
                  >
                    <Input placeholder="请输入库存负责人姓名" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="库存负责人手机号"
                    name="inventoryManagerPhone"
                    rules={PhoneRule("请输入库存负责人手机号")}
                  >
                    <Input placeholder="请输入库存负责人手机号" />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          )}

          <Button htmlType="submit" type="primary" size="large" loading={submitting}>
            提交认证
          </Button>
        </Form>
      </Card>
    </div>
  );
}
