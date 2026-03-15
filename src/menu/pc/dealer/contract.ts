import type { MenuNode } from "../../types";

export const dealerContractMenu: MenuNode[] = [
  {
    id: "dealer-contract-workbench",
    label: "工作台",
    kind: "dashboard",
    entity: "contract",
  },
  {
    id: "dealer-hospital-procurement-contract-management",
    label: "院采合同管理",
    kind: "group",
    children: [
      { id: "dealer-contract-list", label: "合同列表", kind: "records", entity: "contract" },
      { id: "dealer-sign-receipt-upload", label: "签收单上传", kind: "records", entity: "contract" },
    ],
  },
];
