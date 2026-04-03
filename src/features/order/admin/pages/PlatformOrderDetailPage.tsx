import { Button, Card, Descriptions, Space, Table, Tag, Timeline, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type {
  EDistributionOrderRecord,
  EDistributionOrderStatus,
  OrderFulfillmentItem,
  OrderProductItem,
} from "../../shared/mocks/eDistributionOrderFlow.mock";
import { getEDistributionOrderById } from "../../shared/services/eDistributionOrderFlow.mock-service";

const statusColorMap: Record<EDistributionOrderStatus, string> = {
  待审批: "processing",
  待发货: "gold",
  待收货: "blue",
  收货待确认: "cyan",
  收货待重新提交: "warning",
  已完成: "success",
  取消确认中: "orange",
  取消待审批: "volcano",
  已取消: "default",
};

export function PlatformOrderDetailPage() {
  const { detailId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<EDistributionOrderRecord | null>(null);

  useEffect(() => {
    if (!detailId) {
      return;
    }

    void (async () => {
      setLoading(true);
      try {
        setRecord(await getEDistributionOrderById(detailId));
      } finally {
        setLoading(false);
      }
    })();
  }, [detailId]);

  const productColumns: ColumnsType<OrderProductItem> = [
    { title: "产品编码", dataIndex: "productCode", width: 150 },
    { title: "产品名称", dataIndex: "productName", width: 220 },
    { title: "效期类型", dataIndex: "healthType", width: 120 },
    { title: "单价", dataIndex: "unitPrice", width: 120, render: (value: number) => `¥ ${value.toFixed(2)}` },
    { title: "数量", dataIndex: "quantity", width: 100 },
    { title: "金额", dataIndex: "amount", width: 120, render: (value: number) => `¥ ${value.toFixed(2)}` },
  ];

  const fulfillmentColumns: ColumnsType<OrderFulfillmentItem> = [
    { title: "产品编码", dataIndex: "productCode", width: 150 },
    { title: "产品名称", dataIndex: "productName", width: 220 },
    { title: "效期类型", dataIndex: "healthType", width: 140 },
    { title: "批次号", dataIndex: "batchNo", width: 180 },
    { title: "数量", dataIndex: "quantity", width: 100 },
  ];

  function renderDownloadLink(fileName?: string) {
    if (!fileName) {
      return "-";
    }

    return (
      <a href={`data:text/plain;charset=utf-8,${encodeURIComponent(fileName)}`} download={fileName}>
        {fileName}
      </a>
    );
  }

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card className="page-card">
        <div className="agreement-detail__header">
          <Space align="center" size={12}>
            <Button onClick={() => navigate("/admin/order/platform-order-list")}>返回列表</Button>
            <Space align="center" size={12}>
              <Typography.Title level={4} className="agreement-detail__title">
                订单详情
              </Typography.Title>
              {record ? <Tag color={statusColorMap[record.status]}>{record.status}</Tag> : null}
            </Space>
          </Space>
        </div>
      </Card>

      <Card className="page-card" title="订单信息" loading={loading}>
        {record ? (
          <Descriptions column={2} size="small">
            <Descriptions.Item label="订单编号">{record.orderNo}</Descriptions.Item>
            <Descriptions.Item label="平台">{record.platformName}</Descriptions.Item>
            <Descriptions.Item label="分销商名称">{record.distributorName}</Descriptions.Item>
            <Descriptions.Item label="分销商编码">{record.distributorCode}</Descriptions.Item>
            <Descriptions.Item label="商品总数">{record.totalQuantity}</Descriptions.Item>
            <Descriptions.Item label="订单总金额">¥ {record.orderAmount.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="提交时间">{record.createdAt}</Descriptions.Item>
            <Descriptions.Item label="订单状态">
              <Tag color={statusColorMap[record.status]}>{record.status}</Tag>
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Card>

      <Card className="page-card" title="付款信息">
        {record ? (
          <Descriptions column={2} size="small">
            <Descriptions.Item label="付款证明">{renderDownloadLink(record.paymentProof)}</Descriptions.Item>
            <Descriptions.Item label="付款备注">-</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Card>

      <Card className="page-card" title="服务商信息">
        {record ? (
          <Descriptions column={2} size="small">
            <Descriptions.Item label="服务商名称">{record.serviceProviderName}</Descriptions.Item>
            <Descriptions.Item label="服务商编码">{record.serviceProviderCode}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Card>

      <Card className="page-card" title="产品模块">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={record?.products ?? []}
          columns={productColumns}
          tableLayout="fixed"
          pagination={false}
          scroll={{ x: 920 }}
        />
      </Card>

      <Card className="page-card" title="收货人信息">
        {record ? (
          <Descriptions column={2} size="small">
            <Descriptions.Item label="收货人">{record.consigneeName}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{record.consigneePhone}</Descriptions.Item>
            <Descriptions.Item label="省市区">
              {record.consigneeProvince} / {record.consigneeCity} / {record.consigneeDistrict}
            </Descriptions.Item>
            <Descriptions.Item label="邮编">{record.consigneePostalCode || "-"}</Descriptions.Item>
            <Descriptions.Item label="详细地址" span={2}>
              {record.consigneeAddress}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Card>

      <Card className="page-card" title="收货信息">
        {record ? (
          <Descriptions column={2} size="small">
            <Descriptions.Item label="发货时间">{record.shippedAt ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="签收提交时间">{record.receipt?.submittedAt ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="签收单附件">{renderDownloadLink(record.receipt?.receiptDocumentNo)}</Descriptions.Item>
            <Descriptions.Item label="收货明细附件">{renderDownloadLink(record.receipt?.receiptDetails)}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Card>

      <Card className="page-card" title="发货明细">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={record?.shipmentDetails ?? []}
          columns={fulfillmentColumns}
          tableLayout="fixed"
          pagination={false}
          locale={{ emptyText: "暂无发货明细" }}
          scroll={{ x: 920 }}
        />
      </Card>

      <Card className="page-card" title="收货明细">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={record?.receivingDetails ?? []}
          columns={fulfillmentColumns}
          tableLayout="fixed"
          pagination={false}
          locale={{ emptyText: "暂无收货明细" }}
          scroll={{ x: 920 }}
        />
      </Card>

      <Card className="page-card" title="审批记录">
        {record ? (
          <Timeline
            items={record.approvalHistory.map((item) => ({
              children: (
                <Space direction="vertical" size={4}>
                  <Typography.Text strong>{item.nodeName}</Typography.Text>
                  <Typography.Text type="secondary">
                    {item.role} · {item.actorName}（{item.account}） · {item.operatedAt}
                  </Typography.Text>
                  <Typography.Text>{item.decision}</Typography.Text>
                  <Typography.Text type="secondary">{item.remark}</Typography.Text>
                </Space>
              ),
            }))}
          />
        ) : null}
      </Card>
    </Space>
  );
}
