import type { MenuNode } from "../../types";

export const dealerOrderMenu: MenuNode[] = [
  {
    id: "dealer-workbench",
    label: "工作台",
    kind: "dashboard",
    entity: "order",
  },
  {
    id: "dealer-customer-management",
    label: "客户管理",
    kind: "group",
    children: [
      { id: "dealer-store-list", label: "门店列表", kind: "records", entity: "customer" },
      { id: "dealer-distributor-list", label: "分销商列表", kind: "records", entity: "customer" },
      { id: "dealer-batch-store-creation", label: "批量建店", kind: "records", entity: "customer" },
    ],
  },
  {
    id: "dealer-order-management",
    label: "订单管理",
    kind: "group",
    children: [
      { id: "dealer-order-list", label: "订单列表", kind: "records", entity: "order" },
    ],
  },
  {
    id: "dealer-e-distribution-platform",
    label: "E分销平台",
    kind: "group",
    children: [
      { id: "dealer-purchase-sale-agreement-list", label: "购销协议列表", kind: "records", entity: "distribution" },
      { id: "dealer-platform-order-list", label: "订单列表", kind: "records", entity: "distribution" },
      { id: "dealer-shop-list", label: "店铺列表", kind: "records", entity: "distribution" },
      { id: "dealer-product-price-maintenance", label: "产品及价格维护", kind: "schema", entity: "distribution" },
      { id: "dealer-expense-list", label: "费用列表", kind: "records", entity: "distribution" },
      { id: "dealer-off-take-upload", label: "OffTake上传", kind: "records", entity: "distribution" },
    ],
  },
  {
    id: "dealer-finance-management",
    label: "财务管理",
    kind: "group",
    children: [
      { id: "dealer-return-write-off-status-query", label: "退货单核销状态查询", kind: "records", entity: "finance" },
      { id: "dealer-return-agreement-list", label: "退货协议列表", kind: "records", entity: "finance" },
      { id: "dealer-non-mrc-return-list", label: "无MRC退货列表", kind: "records", entity: "finance" },
      { id: "dealer-red-flush-document-list", label: "红冲单据列表", kind: "records", entity: "finance" },
      { id: "dealer-red-invoice-list", label: "红票列表", kind: "records", entity: "finance" },
    ],
  },
];
