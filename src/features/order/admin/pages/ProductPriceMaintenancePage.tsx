import {
  App,
  Button,
  Card,
  Descriptions,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Space,
  Table,
  Tabs,
  Typography,
  Upload,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadFile } from "antd/es/upload/interface";
import { useEffect, useMemo, useState } from "react";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import type { PurchasePriceRecord, SalePriceRecord } from "../mocks/productPriceMaintenance.mock";
import {
  listPurchasePrices,
  listSalePrices,
  pushPurchasePricesToErp,
  savePurchasePrice,
  type PurchasePriceFilters,
  type SalePriceFilters,
} from "../services/productPriceMaintenance.mock-service";

type PriceTab = "purchase" | "sale";

type PurchasePriceFormValues = {
  productCode?: string;
  productName: string;
  imageUrl?: string;
  serviceProviderPurchasePrice: number;
};

function buildImageDataUrl(label: string, color: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
      <rect width="56" height="56" rx="16" fill="${color}" />
      <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="24" font-family="PingFang SC, sans-serif" font-weight="700" fill="#ffffff">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function ProductPriceMaintenancePage() {
  const [purchaseFilterForm] = Form.useForm<PurchasePriceFilters>();
  const [saleFilterForm] = Form.useForm<SalePriceFilters>();
  const [editorForm] = Form.useForm<PurchasePriceFormValues>();
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState<PriceTab>("purchase");
  const [purchaseLoading, setPurchaseLoading] = useState(true);
  const [saleLoading, setSaleLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PurchasePriceRecord | null>(null);
  const [viewingSaleRecord, setViewingSaleRecord] = useState<SalePriceRecord | null>(null);
  const [editorImageUrl, setEditorImageUrl] = useState<string>();
  const [purchaseItems, setPurchaseItems] = useState<PurchasePriceRecord[]>([]);
  const [saleItems, setSaleItems] = useState<SalePriceRecord[]>([]);

  async function fileToDataUrl(file: File) {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("图片读取失败"));
      reader.readAsDataURL(file);
    });
  }

  async function loadPurchaseData(filters: PurchasePriceFilters = {}) {
    setPurchaseLoading(true);
    try {
      setPurchaseItems(await listPurchasePrices(filters));
    } finally {
      setPurchaseLoading(false);
    }
  }

  async function loadSaleData(filters: SalePriceFilters = {}) {
    setSaleLoading(true);
    try {
      setSaleItems(await listSalePrices(filters));
    } finally {
      setSaleLoading(false);
    }
  }

  useEffect(() => {
    void loadPurchaseData();
    void loadSaleData();
  }, []);

  function openCreateModal() {
    setEditingRecord(null);
    editorForm.setFieldsValue({
      productCode: "",
      productName: "",
      imageUrl: undefined,
      serviceProviderPurchasePrice: undefined,
    });
    setEditorImageUrl(undefined);
    setEditorOpen(true);
  }

  function openEditModal(record: PurchasePriceRecord) {
    setEditingRecord(record);
    editorForm.setFieldsValue({
      productCode: record.productCode,
      productName: record.productName,
      imageUrl: record.imageUrl,
      serviceProviderPurchasePrice: record.serviceProviderPurchasePrice,
    });
    setEditorImageUrl(record.imageUrl);
    setEditorOpen(true);
  }

  async function handleSave() {
    const values = await editorForm.validateFields();
    setSaving(true);
    try {
      await savePurchasePrice({
        id: editingRecord?.id,
        productCode: values.productCode ?? "",
        productName: values.productName,
        imageUrl: values.imageUrl,
        serviceProviderPurchasePrice: values.serviceProviderPurchasePrice,
      });
      void message.success(editingRecord ? "产品已更新。" : "产品已新增。");
      setEditorOpen(false);
      setEditingRecord(null);
      setEditorImageUrl(undefined);
      editorForm.resetFields();
      await loadPurchaseData(purchaseFilterForm.getFieldsValue());
    } finally {
      setSaving(false);
    }
  }

  async function handlePushErp() {
    const result = await pushPurchasePricesToErp(purchaseItems);
    void message.success(result);
  }

  const purchaseColumns: ColumnsType<PurchasePriceRecord> = [
    { title: "产品编码", dataIndex: "productCode", width: 160 },
    { title: "产品名称", dataIndex: "productName", width: 240 },
    {
      title: "产品图片",
      dataIndex: "imageLabel",
      width: 120,
      render: (_, record) => (
        <Image
          preview={false}
          width={48}
          height={48}
          src={record.imageUrl ?? buildImageDataUrl(record.imageLabel, record.imageColor)}
          alt={record.productName}
        />
      ),
    },
    {
      title: "服务商进货价",
      dataIndex: "serviceProviderPurchasePrice",
      width: 150,
      render: (value: number) => `¥ ${value.toFixed(2)}`,
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 140,
      render: (_, record) => (
        <Button type="link" onClick={() => openEditModal(record)}>
          编辑产品
        </Button>
      ),
    },
  ];

  const saleColumns: ColumnsType<SalePriceRecord> = [
    { title: "服务商编码", dataIndex: "serviceProviderCode", width: 140 },
    { title: "服务商名称", dataIndex: "serviceProviderName", width: 180 },
    { title: "产品编码", dataIndex: "productCode", width: 150 },
    { title: "产品名称", dataIndex: "productName", width: 220 },
    {
      title: "服务商进货价",
      dataIndex: "serviceProviderPurchasePrice",
      width: 150,
      render: (value: number) => `¥ ${value.toFixed(2)}`,
    },
    {
      title: "服务商出货价（好货）",
      dataIndex: "goodPrice",
      width: 170,
      render: (value: number) => `¥ ${value.toFixed(2)}`,
    },
    {
      title: "服务商出货价（过半）",
      dataIndex: "salePriceAboveHalf",
      width: 170,
      render: (value: number) => `¥ ${value.toFixed(2)}`,
    },
    {
      title: "服务商出货价（过三）",
      dataIndex: "salePriceAboveThird",
      width: 170,
      render: (value: number) => `¥ ${value.toFixed(2)}`,
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 120,
      render: (_, record) => <Button type="link" onClick={() => setViewingSaleRecord(record)}>查看</Button>,
    },
  ];

  const purchaseFilterNode = useMemo(
    () => (
      <Card className="page-card" title="筛选条件">
        <Form form={purchaseFilterForm} layout="vertical">
          <FilterPanel
            fields={[
              <Form.Item key="keyword" name="keyword" label="产品编码 / 产品名称">
                <Input allowClear placeholder="请输入关键词" />
              </Form.Item>,
            ]}
            actions={
              <>
                <Button
                  type="primary"
                  onClick={() => {
                    void loadPurchaseData(purchaseFilterForm.getFieldsValue());
                  }}
                >
                  查询
                </Button>
                <Button
                  onClick={() => {
                    purchaseFilterForm.resetFields();
                    void loadPurchaseData();
                  }}
                >
                  重置
                </Button>
              </>
            }
          />
        </Form>
      </Card>
    ),
    [purchaseFilterForm],
  );

  const saleFilterNode = useMemo(
    () => (
      <Card className="page-card" title="筛选条件">
        <Form form={saleFilterForm} layout="vertical">
          <FilterPanel
            fields={[
              <Form.Item key="keyword" name="keyword" label="产品编码 / 产品名称">
                <Input allowClear placeholder="请输入关键词" />
              </Form.Item>,
              <Form.Item key="serviceProviderCode" name="serviceProviderCode" label="服务商编码">
                <Input allowClear placeholder="请输入服务商编码" />
              </Form.Item>,
              <Form.Item key="serviceProviderName" name="serviceProviderName" label="服务商名称">
                <Input allowClear placeholder="请输入服务商名称" />
              </Form.Item>,
            ]}
            actions={
              <>
                <Button
                  type="primary"
                  onClick={() => {
                    void loadSaleData(saleFilterForm.getFieldsValue());
                  }}
                >
                  查询
                </Button>
                <Button
                  onClick={() => {
                    saleFilterForm.resetFields();
                    void loadSaleData();
                  }}
                >
                  重置
                </Button>
              </>
            }
          />
        </Form>
      </Card>
    ),
    [saleFilterForm],
  );

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card">
        <Tabs
          activeKey={activeTab}
          onChange={(value) => setActiveTab(value as PriceTab)}
          items={[
            { key: "purchase", label: "进货价" },
            { key: "sale", label: "出货价" },
          ]}
        />
      </Card>

      {activeTab === "purchase" ? purchaseFilterNode : saleFilterNode}

      <Card className="page-card">
        {activeTab === "purchase" ? (
          <>
            <div className="e-distributor-page__toolbar">
              <Space>
                <Button type="primary" onClick={openCreateModal}>
                  新增产品
                </Button>
                <Button onClick={() => void handlePushErp()}>推送ERP</Button>
              </Space>
            </div>
            <Table
              rowKey="id"
              loading={purchaseLoading}
              dataSource={purchaseItems}
              columns={purchaseColumns}
              tableLayout="fixed"
              scroll={{ x: 980 }}
              pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
            />
          </>
        ) : (
          <>
            <div className="e-distributor-page__toolbar">
              <Typography.Text type="secondary">出货价仅支持查看。</Typography.Text>
            </div>
            <Table
              rowKey="id"
              loading={saleLoading}
              dataSource={saleItems}
              columns={saleColumns}
              tableLayout="fixed"
              scroll={{ x: 1500 }}
              pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
            />
          </>
        )}
      </Card>

      <Modal
        title={editingRecord ? "编辑产品" : "新增产品"}
        open={editorOpen}
        okText="保存"
        cancelText="取消"
        onCancel={() => {
          setEditorOpen(false);
          setEditingRecord(null);
          setEditorImageUrl(undefined);
          editorForm.resetFields();
        }}
        onOk={() => void handleSave()}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={editorForm} layout="vertical">
          <Form.Item
            name="productCode"
            label="产品编码"
            rules={[{ required: !editingRecord, message: "请输入产品编码" }]}
          >
            <Input placeholder="请输入产品编码" disabled={Boolean(editingRecord)} />
          </Form.Item>
          <Form.Item name="productName" label="产品名称" rules={[{ required: true, message: "请输入产品名称" }]}>
            <Input placeholder="请输入产品名称" />
          </Form.Item>
          <Form.Item name="imageUrl" label="产品图片">
            <Upload
              accept="image/*"
              listType="picture-card"
              maxCount={1}
              beforeUpload={() => false}
              fileList={
                editorImageUrl
                  ? ([
                      {
                        uid: "-1",
                        name: "product-image.png",
                        status: "done",
                        url: editorImageUrl,
                      },
                    ] satisfies UploadFile[])
                  : []
              }
              onChange={(info) => {
                const nextFile = info.fileList[0]?.originFileObj;

                if (!nextFile) {
                  setEditorImageUrl(undefined);
                  editorForm.setFieldValue("imageUrl", undefined);
                  return;
                }

                void (async () => {
                  const dataUrl = await fileToDataUrl(nextFile);
                  setEditorImageUrl(dataUrl);
                  editorForm.setFieldValue("imageUrl", dataUrl);
                })();
              }}
              onRemove={() => {
                setEditorImageUrl(undefined);
                editorForm.setFieldValue("imageUrl", undefined);
              }}
            >
              {!editorImageUrl ? <div>上传图片</div> : null}
            </Upload>
          </Form.Item>
          <Form.Item
            name="serviceProviderPurchasePrice"
            label="服务商进货价"
            rules={[{ required: true, message: "请输入服务商进货价" }]}
          >
            <InputNumber min={0} precision={2} style={{ width: "100%" }} placeholder="请输入服务商进货价" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="出货价详情"
        open={Boolean(viewingSaleRecord)}
        footer={null}
        onCancel={() => setViewingSaleRecord(null)}
        destroyOnHidden
      >
        {viewingSaleRecord ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="服务商编码">{viewingSaleRecord.serviceProviderCode}</Descriptions.Item>
            <Descriptions.Item label="服务商名称">{viewingSaleRecord.serviceProviderName}</Descriptions.Item>
            <Descriptions.Item label="产品编码">{viewingSaleRecord.productCode}</Descriptions.Item>
            <Descriptions.Item label="产品名称">{viewingSaleRecord.productName}</Descriptions.Item>
            <Descriptions.Item label="服务商进货价">
              ¥ {viewingSaleRecord.serviceProviderPurchasePrice.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="服务商出货价（好货）">
              ¥ {viewingSaleRecord.goodPrice.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="服务商出货价（过半）">
              ¥ {viewingSaleRecord.salePriceAboveHalf.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="服务商出货价（过三）">
              ¥ {viewingSaleRecord.salePriceAboveThird.toFixed(2)}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>
    </Space>
  );
}
