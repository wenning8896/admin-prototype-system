import { adminContractMenu } from "./pc/admin/contract";
import { adminOrderMenu } from "./pc/admin/order";
import { adminPortalMenu } from "./pc/admin/portal";
import { dealerContractMenu } from "./pc/dealer/contract";
import { dealerOrderMenu } from "./pc/dealer/order";
import { dealerPortalMenu } from "./pc/dealer/portal";
import { distributorContractMenu } from "./pc/distributor/contract";
import { distributorOrderMenu } from "./pc/distributor/order";
import { distributorPortalMenu } from "./pc/distributor/portal";
import type { MenuNode, RoleCode, RoleMeta, SystemCode, SystemMeta } from "./types";

const menuMap: Record<RoleCode, Record<SystemCode, MenuNode[]>> = {
  admin: {
    order: adminOrderMenu,
    contract: adminContractMenu,
    portal: adminPortalMenu,
  },
  dealer: {
    order: dealerOrderMenu,
    contract: dealerContractMenu,
    portal: dealerPortalMenu,
  },
  distributor: {
    order: distributorOrderMenu,
    contract: distributorContractMenu,
    portal: distributorPortalMenu,
  },
};

export const roleMeta: Record<RoleCode, RoleMeta> = {
  admin: { code: "admin", label: "管理员", description: "负责全局配置与管理流程" },
  dealer: { code: "dealer", label: "经销商", description: "聚焦经销端提交、查询与签署" },
  distributor: { code: "distributor", label: "分销商", description: "聚焦渠道流转和协同审批" },
};

export const systemMeta: Record<SystemCode, SystemMeta> = {
  order: { code: "order", label: "订单系统", description: "下单、查询、审批、跟进" },
  contract: { code: "contract", label: "合同系统", description: "合同台账、签署和审核" },
  portal: { code: "portal", label: "门户系统", description: "首页、消息、配置和门户能力" },
};

export function getMenuForRoute(role?: string, system?: string) {
  if (!role || !system) {
    return undefined;
  }

  if (!(role in menuMap)) {
    return undefined;
  }

  const roleMenus = menuMap[role as RoleCode];

  if (!(system in roleMenus)) {
    return undefined;
  }

  return roleMenus[system as SystemCode];
}

export function findMenuNode(nodes: MenuNode[], targetId: string): MenuNode | undefined {
  for (const node of nodes) {
    if (node.id === targetId) {
      return node;
    }

    if (node.children) {
      const found = findMenuNode(node.children, targetId);

      if (found) {
        return found;
      }
    }
  }

  return undefined;
}

export function findMenuPath(nodes: MenuNode[], targetId: string): string[] {
  for (const node of nodes) {
    if (node.id === targetId) {
      return [node.id];
    }

    if (node.children) {
      const childPath = findMenuPath(node.children, targetId);

      if (childPath.length) {
        return [node.id, ...childPath];
      }
    }
  }

  return [];
}

export function getFirstLeafModuleId(nodes: MenuNode[]): string | undefined {
  for (const node of nodes) {
    if (node.children?.length) {
      const childLeaf = getFirstLeafModuleId(node.children);

      if (childLeaf) {
        return childLeaf;
      }
    } else {
      return node.id;
    }
  }

  return undefined;
}

export function isModuleAvailable(role?: string, system?: string, moduleId?: string) {
  if (!moduleId) {
    return false;
  }

  const menu = getMenuForRoute(role, system);
  return menu ? Boolean(findMenuNode(menu, moduleId)) : false;
}

export function getDefaultPathForRole(role: RoleCode) {
  const defaultSystem: SystemCode = "order";
  const menu = menuMap[role][defaultSystem];
  const defaultModuleId = getFirstLeafModuleId(menu) ?? "order-dashboard";
  return `/${role}/${defaultSystem}/${defaultModuleId}`;
}
