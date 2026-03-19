import { Button, Card, DatePicker, Form, Input, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import quarterOfYear from "dayjs/plugin/quarterOfYear";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { utils, writeFileXLSX } from "xlsx";
import { FilterPanel } from "../../../../app/components/FilterPanel";
import type { SignReceiptRecord } from "../../shared/mocks/signReceipt.mock";
import { listDealerSignReceiptRecords, type SignReceiptFilters } from "../../shared/services/signReceipt.mock-service";

dayjs.extend(quarterOfYear);

type SignReceiptApprovalFormValues = SignReceiptFilters & {
  procurementType?: string;
  orderDateRange?: [Dayjs, Dayjs];
};

type DealerGroupRow = {
  key: string;
  level: "dealer";
  year: string;
  quarter: string;
  dealerCode: string;
  dealerName: string;
  region: string;
  cg: string;
  pendingCount: number | "--";
  status: string;
  children: HospitalGroupRow[];
};

type HospitalGroupRow = {
  key: string;
  level: "hospital";
  year: string;
  month: string;
  hospitalCode: string;
  hospitalName: string;
  procurementType: string;
  pendingCount: number | "--";
  status: string;
  children: OrderDateRow[];
};

type OrderDateRow = {
  key: string;
  level: "orderDate";
  orderDate: string;
  totalCount: number;
  status: string;
  records: SignReceiptRecord[];
};

const statusColorMap: Record<string, string> = {
  未匹配到合同信息: "default",
  无效: "default",
  待审批: "processing",
  已通过: "success",
  已驳回: "error",
};

function resolveReceiptStatus(record: SignReceiptRecord) {
  if (record.contractLifeStatus === "无效") {
    return "无效";
  }
  if (record.status === "审批驳回") {
    return "已驳回";
  }
  if (record.status === "审批通过") {
    return "已通过";
  }
  if (record.status === "待审批") {
    return "待审批";
  }
  return "未匹配到合同信息";
}

function resolveStatus(records: SignReceiptRecord[]) {
  const statuses = records.map(resolveReceiptStatus);
  if (statuses.includes("待审批")) {
    return "待审批";
  }
  if (statuses.includes("无效")) {
    return "无效";
  }
  if (statuses.includes("已驳回")) {
    return "已驳回";
  }
  if (statuses.every((item) => item === "已通过")) {
    return "已通过";
  }
  return "未匹配到合同信息";
}

function getReceiptDate(record: SignReceiptRecord) {
  const rawValue = record.uploadedAt ?? "2026-03-18 00:00";
  return dayjs(rawValue);
}

function buildApprovalTree(records: SignReceiptRecord[]) {
  const dealerGroupMap = new Map<string, DealerGroupRow>();

  records.forEach((record) => {
    const receiptDate = getReceiptDate(record);
    const dealerKey = `${receiptDate.year()}-${receiptDate.quarter()}-${record.dealerCode}`;
    const hospitalKey = `${dealerKey}-${receiptDate.month()}-${record.dmsHospitalCode}`;
    const orderDateKey = `${hospitalKey}-${receiptDate.format("YYYYMMDD")}`;

    if (!dealerGroupMap.has(dealerKey)) {
      dealerGroupMap.set(dealerKey, {
        key: dealerKey,
        level: "dealer",
        year: String(receiptDate.year()),
        quarter: `${receiptDate.quarter()}`,
        dealerCode: record.dealerCode,
        dealerName: record.dealerName,
        region: "东区",
        cg: "苏北",
        pendingCount: 0,
        status: resolveReceiptStatus(record),
        children: [],
      });
    }

    const dealerGroup = dealerGroupMap.get(dealerKey)!;
    let hospitalGroup = dealerGroup.children.find((item) => item.key === hospitalKey);
    if (!hospitalGroup) {
      hospitalGroup = {
        key: hospitalKey,
        level: "hospital",
        year: String(receiptDate.year()),
        month: String(receiptDate.month() + 1),
        hospitalCode: record.dmsHospitalCode,
        hospitalName: record.dmsHospitalName,
        procurementType: record.procurementType,
        pendingCount: 0,
        status: resolveReceiptStatus(record),
        children: [],
      };
      dealerGroup.children.push(hospitalGroup);
    }

    let orderDateGroup = hospitalGroup.children.find((item) => item.key === orderDateKey);
    if (!orderDateGroup) {
      orderDateGroup = {
        key: orderDateKey,
        level: "orderDate",
        orderDate: receiptDate.format("YYYYMMDD"),
        totalCount: 0,
        status: resolveReceiptStatus(record),
        records: [],
      };
      hospitalGroup.children.push(orderDateGroup);
    }

    orderDateGroup.records.push(record);
    orderDateGroup.totalCount = orderDateGroup.records.length;
    orderDateGroup.status = resolveStatus(orderDateGroup.records);
  });

  const groups = Array.from(dealerGroupMap.values()).map((dealerGroup) => {
    dealerGroup.children = dealerGroup.children.map((hospitalGroup) => {
      hospitalGroup.pendingCount = hospitalGroup.children.reduce((count, item) => count + item.records.filter((record) => record.status === "待审批").length, 0) || "--";
      hospitalGroup.status = resolveStatus(hospitalGroup.children.flatMap((item) => item.records));
      return hospitalGroup;
    });
    dealerGroup.pendingCount = dealerGroup.children.reduce((count, item) => count + (typeof item.pendingCount === "number" ? item.pendingCount : 0), 0) || "--";
    dealerGroup.status = resolveStatus(dealerGroup.children.flatMap((item) => item.children.flatMap((child) => child.records)));
    return dealerGroup;
  });

  return groups;
}

function exportApprovalData(rows: DealerGroupRow[]) {
  const worksheet = utils.json_to_sheet(
    rows.flatMap((dealerRow) =>
      dealerRow.children.flatMap((hospitalRow) =>
        hospitalRow.children.flatMap((dateRow) =>
          dateRow.records.map((record) => ({
            年: dealerRow.year,
            季度: dealerRow.quarter,
            经销商编码: dealerRow.dealerCode,
            经销商名称: dealerRow.dealerName,
            大区: dealerRow.region,
            CG: dealerRow.cg,
            月: hospitalRow.month,
            医院编码: hospitalRow.hospitalCode,
            医院名称: hospitalRow.hospitalName,
            采购类型: hospitalRow.procurementType,
            订单日期: dateRow.orderDate,
            总箱数: dateRow.totalCount,
            状态: resolveReceiptStatus(record),
            合同编号: record.contractNo,
          })),
        ),
      ),
    ),
  );
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "签收单审批");
  writeFileXLSX(workbook, `签收单审批_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
}

export function SignReceiptApprovalPage() {
  const [form] = Form.useForm<SignReceiptApprovalFormValues>();
  const [items, setItems] = useState<SignReceiptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDealerKeys, setExpandedDealerKeys] = useState<React.Key[]>([]);
  const [expandedHospitalKeys, setExpandedHospitalKeys] = useState<React.Key[]>([]);
  const navigate = useNavigate();

  async function loadData(filters: SignReceiptApprovalFormValues = {}) {
    setLoading(true);
    try {
      const baseFilters: SignReceiptFilters = {
        contractNo: filters.contractNo,
        dealerCode: filters.dealerCode,
        hospitalCode: filters.hospitalCode,
      };
      const records = await listDealerSignReceiptRecords(baseFilters);
      const [startDate, endDate] = filters.orderDateRange ?? [];
      setItems(
        records.filter((item) => {
          const matchesProcurementType = !filters.procurementType || item.procurementType === filters.procurementType;
          const receiptDate = getReceiptDate(item);
          const matchesStatus = !filters.status || resolveReceiptStatus(item) === filters.status;
          const matchesDateRange =
            !startDate ||
            !endDate ||
            (receiptDate.isAfter(startDate.startOf("day").subtract(1, "day")) &&
              receiptDate.isBefore(endDate.endOf("day").add(1, "day")));
          return matchesProcurementType && matchesDateRange && matchesStatus;
        }),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const treeData = useMemo(() => buildApprovalTree(items), [items]);

  const dealerColumns: ColumnsType<DealerGroupRow> = [
    { title: "年", dataIndex: "year", width: 80 },
    { title: "季度", dataIndex: "quarter", width: 80 },
    { title: "经销商编码", dataIndex: "dealerCode", width: 180 },
    { title: "经销商名称", dataIndex: "dealerName", width: 260 },
    { title: "大区", dataIndex: "region", width: 120 },
    { title: "CG", dataIndex: "cg", width: 120 },
    { title: "待审批数量", dataIndex: "pendingCount", width: 140 },
    { title: "状态", dataIndex: "status", width: 120, render: (value: string) => <Tag color={statusColorMap[value]}>{value}</Tag> },
    {
      title: "操作",
      key: "actions",
      width: 120,
      render: (_, row) => (
        <Button
          type="link"
          onClick={() =>
            setExpandedDealerKeys((current) =>
              current.includes(row.key) ? current.filter((item) => item !== row.key) : [...current, row.key],
            )
          }
        >
          {expandedDealerKeys.includes(row.key) ? "收起" : "展开"}
        </Button>
      ),
    },
  ];

  const hospitalColumns: ColumnsType<HospitalGroupRow> = [
    { title: "年", dataIndex: "year", width: 80 },
    { title: "月", dataIndex: "month", width: 80 },
    { title: "医院编码", dataIndex: "hospitalCode", width: 220 },
    { title: "医院名称", dataIndex: "hospitalName", width: 300 },
    { title: "采购类型", dataIndex: "procurementType", width: 120, render: (value: string) => <Tag color="blue">{value}</Tag> },
    { title: "待审批数量", dataIndex: "pendingCount", width: 140 },
    { title: "状态", dataIndex: "status", width: 120, render: (value: string) => <Tag color={statusColorMap[value]}>{value}</Tag> },
    {
      title: "操作",
      key: "actions",
      width: 120,
      render: (_, row) => (
        <Button
          type="link"
          onClick={() =>
            setExpandedHospitalKeys((current) =>
              current.includes(row.key) ? current.filter((item) => item !== row.key) : [...current, row.key],
            )
          }
        >
          {expandedHospitalKeys.includes(row.key) ? "收起" : "展开"}
        </Button>
      ),
    },
  ];

  const orderDateColumns: ColumnsType<OrderDateRow> = [
    { title: "订单日期", dataIndex: "orderDate", width: 180 },
    { title: "总箱数", dataIndex: "totalCount", width: 120 },
    { title: "状态", dataIndex: "status", width: 120, render: (value: string) => <Tag color={statusColorMap[value]}>{value}</Tag> },
    {
      title: "操作",
      key: "actions",
      width: 180,
      render: (_, row) => {
        const firstRecord = row.records[0];
        if (!firstRecord) {
          return "-";
        }

        return (
          <Space size={4}>
            {firstRecord.status === "待审批" ? (
              <Button type="link" onClick={() => navigate(`/admin/contract/sign-receipt-approval/detail/${firstRecord.id}`)}>
                去审批
              </Button>
            ) : (
              <Button type="link" onClick={() => navigate(`/admin/contract/sign-receipt-approval/detail/${firstRecord.id}`)}>
                查看详情
              </Button>
            )}
            <Button type="link" onClick={() => navigate(`/admin/contract/sign-receipt-approval/detail/${firstRecord.id}`)}>
              审批记录
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card" title="筛选条件">
        <Form form={form} layout="vertical">
          <FilterPanel
            fields={[
              <Form.Item key="procurementType" name="procurementType" label="采购类型">
                <Select allowClear placeholder="选择采购类型" options={[{ label: "直采", value: "直采" }, { label: "三方", value: "三方" }]} />
              </Form.Item>,
              <Form.Item key="status" name="status" label="审批状态">
                <Select
                  allowClear
                  placeholder="选择审批状态"
                  options={["未匹配到合同信息", "无效", "已驳回", "待审批", "已通过"].map((item) => ({ label: item, value: item }))}
                />
              </Form.Item>,
              <Form.Item key="orderDateRange" name="orderDateRange" label="订单开始日期至结束日期">
                <DatePicker.RangePicker style={{ width: "100%" }} />
              </Form.Item>,
              <Form.Item key="dealerCode" name="dealerCode" label="经销商编码">
                <Input allowClear placeholder="请输入经销商编码" />
              </Form.Item>,
            ]}
            actions={
              <>
                <Button type="primary" onClick={() => void loadData(form.getFieldsValue())}>查询</Button>
                <Button onClick={() => { form.resetFields(); void loadData(); }}>重置</Button>
                <Button onClick={() => { setExpandedDealerKeys([]); setExpandedHospitalKeys([]); }}>收起更多搜索项</Button>
              </>
            }
          />
        </Form>
      </Card>

      <Card
        className="page-card"
        extra={
          <Button
            type="primary"
            onClick={() => {
              exportApprovalData(treeData);
            }}
          >
            导出数据
          </Button>
        }
      >
        <Table
          rowKey="key"
          loading={loading}
          dataSource={treeData}
          columns={dealerColumns}
          pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
          expandable={{
            expandedRowKeys: expandedDealerKeys,
            onExpandedRowsChange: (keys) => setExpandedDealerKeys([...keys]),
            expandedRowRender: (dealerRow) => (
              <Table
                rowKey="key"
                dataSource={dealerRow.children}
                columns={hospitalColumns}
                pagination={false}
                tableLayout="fixed"
                scroll={{ x: 1280 }}
                expandable={{
                  expandedRowKeys: expandedHospitalKeys,
                  onExpandedRowsChange: (keys) => setExpandedHospitalKeys([...keys]),
                  expandedRowRender: (hospitalRow) => (
                    <Table
                      rowKey="key"
                      dataSource={hospitalRow.children}
                      columns={orderDateColumns}
                      pagination={false}
                      tableLayout="fixed"
                      scroll={{ x: 860 }}
                    />
                  ),
                }}
              />
            ),
          }}
          tableLayout="fixed"
          scroll={{ x: 1460 }}
        />
      </Card>
    </Space>
  );
}
