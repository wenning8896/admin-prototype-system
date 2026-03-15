import type { MenuNode } from "../../types";

export const distributorOrderMenu: MenuNode[] = [
  {
    id: "distributor-workbench",
    label: "工作台",
    kind: "dashboard",
    entity: "order",
  },
  {
    id: "distributor-e-distribution-platform",
    label: "E分销平台",
    kind: "group",
    children: [
      { id: "distributor-order-list", label: "订单列表", kind: "records", entity: "distribution" },
      { id: "distributor-receiving-address-list", label: "收货地址列表", kind: "records", entity: "distribution" },
      { id: "distributor-inventory-list", label: "库存列表", kind: "records", entity: "distribution" },
      { id: "distributor-shop-list", label: "店铺列表", kind: "records", entity: "distribution" },
      { id: "distributor-off-take-upload", label: "OffTake上传", kind: "records", entity: "distribution" },
    ],
  },
];
