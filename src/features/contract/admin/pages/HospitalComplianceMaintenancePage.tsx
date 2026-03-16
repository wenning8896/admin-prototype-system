import { App, Button, Card, Space, Table } from "antd";
import { utils, writeFileXLSX } from "xlsx";
import dayjs from "dayjs";

const rows = [
  { id: "compliance-1", etmsId: "ETMS-S-001", createdAt: "2026-03-01 10:00" },
  { id: "compliance-2", etmsId: "ETMS-S-002", createdAt: "2026-03-05 11:30" },
];

export function HospitalComplianceMaintenancePage() {
  const { message } = App.useApp();

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card
        className="page-card"
        extra={
          <Space>
            <Button onClick={() => void message.info("导入新增会按 ETMS-ID 去重新增。")}>导入新增</Button>
            <Button onClick={() => void message.info("导入删除会按 ETMS-ID 删除现有记录。")}>导入删除</Button>
            <Button
              onClick={() => {
                const worksheet = utils.json_to_sheet(rows.map((item) => ({ "签署合同医院ETMS-ID": item.etmsId, 创建时间: item.createdAt })));
                const workbook = utils.book_new();
                utils.book_append_sheet(workbook, worksheet, "医院合规维护");
                writeFileXLSX(workbook, `医院合规维护_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
                void message.success("医院合规维护已导出为 .xlsx 文件。");
              }}
            >
              导出
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          dataSource={rows}
          columns={[
            { title: "签署合同医院ETMS-ID", dataIndex: "etmsId", width: 240 },
            { title: "创建时间", dataIndex: "createdAt", width: 180 },
          ]}
          pagination={{ pageSize: 8, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>
    </Space>
  );
}
