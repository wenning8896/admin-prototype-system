import { App, Button, Card, Form, Input, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import type { ContractVersionRecord, HospitalContractRecord } from "../../shared/mocks/hospitalContract.mock";
import { exportContractVersion, listHospitalContracts } from "../../shared/services/hospitalContract.mock-service";

type VersionRow = ContractVersionRecord & {
  contractNo: string;
};

export function ContractHistoryVersionPage() {
  const [form] = Form.useForm<{ contractNo?: string }>();
  const [items, setItems] = useState<VersionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordMap, setRecordMap] = useState<Record<string, HospitalContractRecord>>({});
  const { message } = App.useApp();

  async function loadData(contractNo?: string) {
    setLoading(true);
    try {
      const all = await listHospitalContracts({ contractNo });
      setRecordMap(Object.fromEntries(all.map((item) => [item.contractNo, item])));
      setItems(all.flatMap((item) => item.versions.map((version) => ({ ...version, contractNo: item.contractNo }))));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const columns: ColumnsType<VersionRow> = [
    { title: "合同编号", dataIndex: "contractNo", width: 180 },
    { title: "版本", dataIndex: "versionLabel", width: 120 },
    { title: "动作", dataIndex: "actionType", width: 120 },
    { title: "生成时间", dataIndex: "createdAt", width: 180 },
    {
      title: "操作",
      width: 140,
      render: (_, row) => (
        <Button
          type="link"
          onClick={() => {
            const record = recordMap[row.contractNo];
            if (!record) {
              void message.warning("未找到对应合同记录。");
              return;
            }
            exportContractVersion(record, row);
            void message.success("合同版本已导出。");
          }}
        >
          导出指定版本
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
              <Form.Item key="contractNo" name="contractNo" label="合同编号">
                <Input allowClear placeholder="请输入合同编号" />
              </Form.Item>,
            ]}
            actions={
              <>
                <Button type="primary" onClick={() => void loadData(form.getFieldValue("contractNo"))}>查询</Button>
                <Button onClick={() => { form.resetFields(); void loadData(); }}>重置</Button>
              </>
            }
          />
        </Form>
      </Card>
      <Card className="page-card">
        <Table rowKey="id" loading={loading} dataSource={items} columns={columns} tableLayout="fixed" scroll={{ x: 760 }} pagination={{ pageSize: 8, showTotal: (total) => `共 ${total} 条` }} />
      </Card>
    </Space>
  );
}
