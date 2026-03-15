export type MenuNode = {
  id: string;
  label: string;
  kind: "group" | "records" | "approval" | "dashboard" | "schema";
  entity?: string;
  children?: MenuNode[];
};

export type RoleCode = "admin" | "dealer" | "distributor";
export type SystemCode = "order" | "contract" | "portal";

export type RoleMeta = {
  code: RoleCode;
  label: string;
  description: string;
};

export type SystemMeta = {
  code: SystemCode;
  label: string;
  description: string;
};
