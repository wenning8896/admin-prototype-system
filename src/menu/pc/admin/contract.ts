import type { MenuNode } from "../../types";

export const adminContractMenu: MenuNode[] = [
  {
    id: "contract-workbench",
    label: "工作台",
    kind: "dashboard",
    entity: "contract",
  },
  {
    id: "hospital-procurement-contract-management",
    label: "院采合同管理",
    kind: "group",
    children: [
      {
        id: "contract-management",
        label: "合同管理",
        kind: "group",
        children: [
          { id: "contract-list", label: "合同列表", kind: "records", entity: "contract" },
          { id: "abnormal-contract-list", label: "合同关闭代办清单", kind: "records", entity: "contract" },
          { id: "contract-approval", label: "待审批合同", kind: "approval", entity: "contract" },
          { id: "hospital-procurement-product-list", label: "院采产品列表", kind: "records", entity: "contract" },
          { id: "hospital-compliance-maintenance", label: "医院合规维护", kind: "schema", entity: "contract" },
          { id: "contract-history-version", label: "合同历史版本", kind: "records", entity: "contract" },
          { id: "contract-editable-time-lock", label: "合同可编辑时间锁", kind: "schema", entity: "contract" },
        ],
      },
      {
        id: "sign-receipt-management",
        label: "签收单管理",
        kind: "group",
        children: [
          { id: "sign-receipt-approval", label: "签收单审批", kind: "approval", entity: "contract" },
          { id: "hospital-receiver-list", label: "医院收货人列表", kind: "records", entity: "contract" },
          { id: "sign-receipt-upload-time-lock", label: "签收单上传时间锁", kind: "schema", entity: "contract" },
          { id: "sign-receipt-statistics", label: "签收单统计数据", kind: "dashboard", entity: "contract" },
        ],
      },
    ],
  },
];
