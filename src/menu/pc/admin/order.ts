import type { MenuNode } from "../../types";

export const adminOrderMenu: MenuNode[] = [
  {
    id: "workbench",
    label: "工作台",
    kind: "dashboard",
    entity: "order",
  },
  {
    id: "customer-management",
    label: "客户管理",
    kind: "group",
    children: [
      {
        id: "available-dealer-management",
        label: "可用经销商管理",
        kind: "records",
        entity: "customer",
      },
      {
        id: "dt-dealer-management",
        label: "DT经销商管理",
        kind: "records",
        entity: "customer",
      },
      {
        id: "dd-dealer-management",
        label: "DD经销商管理",
        kind: "records",
        entity: "customer",
      },
      {
        id: "distributor-management",
        label: "分销商管理",
        kind: "group",
        children: [
          { id: "distributor-list", label: "分销商列表", kind: "records", entity: "customer" },
          { id: "distributor-approval", label: "分销商审批", kind: "approval", entity: "customer" },
          {
            id: "dealer-distributor-supply-relation-maintenance",
            label: "经分供货关系维护",
            kind: "records",
            entity: "customer",
          },
          {
            id: "dealer-distributor-supply-relation-approval",
            label: "经分供货关系审批",
            kind: "approval",
            entity: "customer",
          },
        ],
      },
      {
        id: "store-management",
        label: "门店管理",
        kind: "group",
        children: [
          { id: "store-list", label: "门店列表", kind: "records", entity: "store" },
          { id: "virtual-store-list", label: "虚拟门店列表", kind: "records", entity: "store" },
          { id: "batch-store-creation-list", label: "批量建店列表", kind: "records", entity: "store" },
          { id: "batch-store-creation-approval", label: "批量建店审批", kind: "approval", entity: "store" },
        ],
      },
      {
        id: "basic-data-management",
        label: "基础数据管理",
        kind: "group",
        children: [
          { id: "store-channel-maintenance", label: "门店渠道维护", kind: "schema", entity: "master-data" },
          { id: "city-master-maintenance", label: "CityMaster维护", kind: "schema", entity: "master-data" },
          { id: "customer-group-maintenance", label: "客户组维护", kind: "schema", entity: "master-data" },
        ],
      },
    ],
  },
  {
    id: "suggestion-order-management",
    label: "建议订单管理",
    kind: "group",
    children: [
      { id: "suggestion-order-list", label: "建议订单列表", kind: "records", entity: "order" },
      { id: "suggestion-order-approval", label: "建议订单审批", kind: "approval", entity: "order" },
      { id: "interception-release-application", label: "解除拦截申请", kind: "records", entity: "order" },
      { id: "interception-release-approval", label: "解除拦截审批", kind: "approval", entity: "order" },
      { id: "si-achievement-estimation-dashboard", label: "SI达成预估看版", kind: "dashboard", entity: "order" },
    ],
  },
  {
    id: "suggestion-order-settings",
    label: "建议订单设置",
    kind: "group",
    children: [
      { id: "order-date-config", label: "OrderDate配置", kind: "schema", entity: "setting" },
      { id: "sales-forecast-upload", label: "销量预估上传", kind: "schema", entity: "setting" },
      { id: "sales-ratio-calibration", label: "销量占比校准", kind: "schema", entity: "setting" },
      { id: "pending-order-config", label: "PendingOrder配置", kind: "schema", entity: "setting" },
      { id: "turnover-days-config", label: "周转天数配置", kind: "schema", entity: "setting" },
      { id: "approval-trigger-reason", label: "触发审批原因", kind: "schema", entity: "setting" },
      { id: "sold-to-list", label: "SoldTo列表", kind: "schema", entity: "setting" },
      { id: "ship-to-list", label: "ShipTo列表", kind: "schema", entity: "setting" },
      { id: "ship-to-mapping", label: "ShipTo Mapping", kind: "schema", entity: "setting" },
      { id: "inventory-intercept-config", label: "库存拦截配置", kind: "schema", entity: "setting" },
    ],
  },
  {
    id: "product-settings",
    label: "产品设置",
    kind: "group",
    children: [
      { id: "suggested-product-maintenance", label: "建议产品维护", kind: "schema", entity: "product" },
      { id: "product-mapping", label: "产品 Mapping", kind: "schema", entity: "product" },
    ],
  },
  {
    id: "order-management",
    label: "订单管理",
    kind: "group",
    children: [
      { id: "order-list", label: "订单列表", kind: "records", entity: "order" },
    ],
  },
  {
    id: "e-distribution-platform",
    label: "E分销平台",
    kind: "group",
    children: [
      {
        id: "e-distributor-management",
        label: "分销商管理",
        kind: "group",
        children: [
          { id: "e-distributor-list", label: "分销商列表", kind: "records", entity: "distribution" },
          { id: "contract-signing-list", label: "签约列表", kind: "records", entity: "distribution" },
          { id: "contract-signing-approval", label: "签约审批", kind: "approval", entity: "distribution" },
          { id: "distributor-inventory-list", label: "分销商库存列表", kind: "records", entity: "distribution" },
        ],
      },
      {
        id: "service-provider-management",
        label: "服务商管理",
        kind: "group",
        children: [
          { id: "service-provider-list", label: "服务商列表", kind: "records", entity: "distribution" },
          { id: "service-provider-inventory-list", label: "服务商库存列表", kind: "records", entity: "distribution" },
        ],
      },
      {
        id: "platform-basic-config",
        label: "基础配置",
        kind: "group",
        children: [
          { id: "platform-config", label: "平台配置", kind: "schema", entity: "distribution" },
          { id: "product-price-maintenance", label: "产品及价格维护", kind: "schema", entity: "distribution" },
          { id: "quota-management", label: "配额管理", kind: "schema", entity: "distribution" },
          { id: "approval-flow-config", label: "审批流配置", kind: "schema", entity: "distribution" },
          { id: "service-owner-maintenance", label: "服务商负责人维护", kind: "schema", entity: "distribution" },
          { id: "line-manager-maintenance", label: "直线经理维护", kind: "schema", entity: "distribution" },
          { id: "distributor-manager-maintenance", label: "分销经理维护", kind: "schema", entity: "distribution" },
        ],
      },
      {
        id: "platform-order-management",
        label: "订单管理",
        kind: "group",
        children: [
          { id: "platform-order-list", label: "订单列表", kind: "records", entity: "distribution" },
          { id: "platform-order-approval", label: "订单审批", kind: "approval", entity: "distribution" },
        ],
      },
      {
        id: "expense-management",
        label: "费用管理",
        kind: "group",
        children: [
          { id: "expense-upload", label: "费用上传", kind: "records", entity: "distribution" },
        ],
      },
      {
        id: "shop-management",
        label: "店铺管理",
        kind: "group",
        children: [
          { id: "shop-list", label: "店铺列表", kind: "records", entity: "distribution" },
          { id: "shop-approval", label: "店铺审批", kind: "approval", entity: "distribution" },
          { id: "off-take-list", label: "OffTake列表", kind: "records", entity: "distribution" },
        ],
      },
    ],
  },
  {
    id: "finance-management",
    label: "财务管理",
    kind: "group",
    children: [
      { id: "return-write-off-status-query", label: "退货单核销状态查询", kind: "records", entity: "finance" },
      { id: "return-agreement-list", label: "退货协议列表", kind: "records", entity: "finance" },
      { id: "non-mrc-return-list", label: "无MRC退货列表", kind: "records", entity: "finance" },
      { id: "non-mrc-return-approval", label: "无MRC退货审批", kind: "approval", entity: "finance" },
      { id: "red-flush-document-list", label: "红冲单据列表", kind: "records", entity: "finance" },
      { id: "red-invoice-list", label: "红票列表", kind: "records", entity: "finance" },
    ],
  },
];
