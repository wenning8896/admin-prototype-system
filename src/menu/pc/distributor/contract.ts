import type { MenuNode } from "../../types";

export const distributorContractMenu: MenuNode[] = [
  {
    id: "distributor-contract-workbench",
    label: "工作台",
    kind: "dashboard",
    entity: "contract",
  },
  {
    id: "distributor-contract-list",
    label: "合同列表",
    kind: "records",
    entity: "contract",
  },
];
