import { Button, Card, Form, Input, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import {
  listPurchaseAgreements,
  type AgreementStage,
  type PurchaseAgreementRecord,
} from "../../../agreement/shared/services/purchaseAgreementFlow.mock-service";

const stageColorMap: Record<AgreementStage, string> = {
  待签约审批: "processing",
  待服务商补充: "warning",
  待分销商签署: "purple",
  待服务商签署: "gold",
  已签署完成: "success",
  审批驳回: "error",
};

export function DistributorContractListPage() {
  const [form] = Form.useForm<{
    agreementNo?: string;
    distributorName?: string;
    serviceProviderName?: string;
    status?: AgreementStage;
  }>();
  const [items, setItems] = useState<PurchaseAgreementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function loadData(
    filters: {
      agreementNo?: string;
      distributorName?: string;
      serviceProviderName?: string;
      status?: AgreementStage;
    } = {},
  ) {
    setLoading(true);
    try {
      const all = await listPurchaseAgreements();
      const agreementNo = filters.agreementNo?.trim().toLowerCase();
      const distributorName = filters.distributorName?.trim().toLowerCase();
      const serviceProviderName = filters.serviceProviderName?.trim().toLowerCase();

      setItems(
        all.filter((item) => {
          const matchesAgreementNo =
            !agreementNo || (item.agreementNo ?? item.applicationNo).toLowerCase().includes(agreementNo);
          const matchesDistributorName =
            !distributorName || item.distributorName.toLowerCase().includes(distributorName);
          const matchesServiceProviderName =
            !serviceProviderName || item.serviceProviderName.toLowerCase().includes(serviceProviderName);
          const matchesStatus = !filters.status || item.status === filters.status;

          return (
            matchesAgreementNo &&
            matchesDistributorName &&
            matchesServiceProviderName &&
            matchesStatus &&
            item.status !== "待签约审批" &&
            item.status !== "审批驳回"
          );
        }),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const columns: ColumnsType<PurchaseAgreementRecord> = [
    {
      title: "协议编号",
      dataIndex: "agreementNo",
      width: 180,
      render: (value: string | undefined, record) => value ?? record.applicationNo,
    },
    { title: "分销商名称", dataIndex: "distributorName", width: 220 },
    { title: "服务商", dataIndex: "serviceProviderName", width: 180 },
    {
      title: "当前状态",
      dataIndex: "status",
      width: 150,
      render: (value: AgreementStage) => <Tag color={stageColorMap[value]}>{value}</Tag>,
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 180,
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => navigate(`/distributor/contract/distributor-contract-list/detail/${record.id}`)}
        >
          {record.status === "待分销商签署" ? "填写合同" : "查看"}
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card" title="筛选条件">
        <Form form={form} layout="vertical">
          <FilterPanel
            fields={[
              <Form.Item key="agreementNo" name="agreementNo" label="协议编号">
                <Input allowClear placeholder="请输入协议编号" />
              </Form.Item>,
              <Form.Item key="distributorName" name="distributorName" label="分销商名称">
                <Input allowClear placeholder="请输入分销商名称" />
              </Form.Item>,
              <Form.Item key="serviceProviderName" name="serviceProviderName" label="服务商">
                <Input allowClear placeholder="请输入服务商名称" />
              </Form.Item>,
              <Form.Item key="status" name="status" label="当前状态">
                <Select
                  allowClear
                  placeholder="请选择"
                  options={Object.keys(stageColorMap).map((item) => ({ label: item, value: item }))}
                />
              </Form.Item>,
            ]}
            actions={
              <>
                <Button type="primary" onClick={() => void loadData(form.getFieldsValue())}>
                  查询
                </Button>
                <Button
                  onClick={() => {
                    form.resetFields();
                    void loadData();
                  }}
                >
                  重置
                </Button>
              </>
            }
          />
        </Form>
      </Card>

      <Card className="page-card">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          columns={columns}
          tableLayout="fixed"
          scroll={{ x: 1040 }}
          pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>
    </Space>
  );
}
