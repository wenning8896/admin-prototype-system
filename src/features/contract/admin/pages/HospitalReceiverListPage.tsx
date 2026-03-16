import { App, Button, Card, Space, Table } from "antd";
import { utils, writeFileXLSX } from "xlsx";
import dayjs from "dayjs";

const rows = [
  { id: "receiver-row-1", dmsCode: "HSP-DMS-001", etmsId: "ETMS-S-001", receiverName: "赵医生", receiverId: "RCV-001" },
  { id: "receiver-row-2", dmsCode: "HSP-DMS-002", etmsId: "ETMS-S-002", receiverName: "李老师", receiverId: "RCV-003" },
];

export function HospitalReceiverListPage() {
  const { message } = App.useApp();

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card
        className="page-card"
        extra={
          <Space>
            <Button onClick={() => void message.info("导入会按 DMS编码 + ETMS-ID + 收货人ID 进行覆盖更新。")}>导入</Button>
            <Button
              onClick={() => {
                const worksheet = utils.json_to_sheet(
                  rows.map((item) => ({
                    DMS编码: item.dmsCode,
                    "签署合同医院ETMS-ID": item.etmsId,
                    收货人姓名: item.receiverName,
                    收货人ID: item.receiverId,
                  })),
                );
                const workbook = utils.book_new();
                utils.book_append_sheet(workbook, worksheet, "医院收货人列表");
                writeFileXLSX(workbook, `医院收货人列表_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
                void message.success("医院收货人列表已导出为 .xlsx 文件。");
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
            { title: "DMS编码", dataIndex: "dmsCode", width: 180 },
            { title: "签署合同医院ETMS-ID", dataIndex: "etmsId", width: 200 },
            { title: "收货人姓名", dataIndex: "receiverName", width: 180 },
            { title: "收货人ID", dataIndex: "receiverId", width: 160 },
          ]}
          pagination={{ pageSize: 8, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>
    </Space>
  );
}
