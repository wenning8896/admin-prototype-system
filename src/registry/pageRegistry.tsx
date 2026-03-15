import type { ComponentType } from "react";
import { ContractListPage } from "../features/contract/admin/pages/ContractListPage";
import { DistributorContractDetailPage } from "../features/contract/distributor/pages/DistributorContractDetailPage";
import { DistributorContractListPage } from "../features/contract/distributor/pages/DistributorContractListPage";
import { ContractSigningApprovalDetailPage } from "../features/order/admin/pages/ContractSigningApprovalDetailPage";
import { CustomerDistributorApprovalDetailPage } from "../features/order/admin/pages/CustomerDistributorApprovalDetailPage";
import { CustomerDistributorApprovalPage } from "../features/order/admin/pages/CustomerDistributorApprovalPage";
import { CustomerDistributorDetailPage } from "../features/order/admin/pages/CustomerDistributorDetailPage";
import { CustomerDistributorListPage } from "../features/order/admin/pages/CustomerDistributorListPage";
import { DealerDistributorSupplyRelationApprovalPage } from "../features/order/admin/pages/DealerDistributorSupplyRelationApprovalPage";
import { DealerDistributorSupplyRelationPage } from "../features/order/admin/pages/DealerDistributorSupplyRelationPage";
import { EDistributorListPage } from "../features/order/admin/pages/EDistributorListPage";
import { InventoryInterceptConfigPage } from "../features/order/admin/pages/InventoryInterceptConfigPage";
import { InterceptionReleaseApplicationDetailPage } from "../features/order/admin/pages/InterceptionReleaseApplicationDetailPage";
import { InterceptionReleaseApplicationPage } from "../features/order/admin/pages/InterceptionReleaseApplicationPage";
import { ContractSigningApprovalPage } from "../features/order/admin/pages/ContractSigningApprovalPage";
import { DistributorInventoryListPage } from "../features/order/admin/pages/DistributorInventoryListPage";
import { ServiceProviderInventoryListPage } from "../features/order/admin/pages/ServiceProviderInventoryListPage";
import { ServiceProviderListPage } from "../features/order/admin/pages/ServiceProviderListPage";
import { ShipToListPage } from "../features/order/admin/pages/ShipToListPage";
import { ShipToMappingPage } from "../features/order/admin/pages/ShipToMappingPage";
import { SoldToListPage } from "../features/order/admin/pages/SoldToListPage";
import {
  DistributorManagerMaintenancePage,
  LineManagerMaintenancePage,
  ServiceOwnerMaintenancePage,
} from "../features/order/admin/pages/ServiceOwnerMaintenancePage";
import { PlatformConfigPage } from "../features/order/admin/pages/PlatformConfigPage";
import { PlatformOrderDetailPage } from "../features/order/admin/pages/PlatformOrderDetailPage";
import { PlatformOrderApprovalDetailPage } from "../features/order/admin/pages/PlatformOrderApprovalDetailPage";
import { PlatformOrderApprovalPage } from "../features/order/admin/pages/PlatformOrderApprovalPage";
import { PlatformOrderListPage } from "../features/order/admin/pages/PlatformOrderListPage";
import { ProductPriceMaintenancePage } from "../features/order/admin/pages/ProductPriceMaintenancePage";
import { DealerPlatformOrderDetailPage } from "../features/order/dealer/pages/DealerPlatformOrderDetailPage";
import { DealerPlatformOrderListPage } from "../features/order/dealer/pages/DealerPlatformOrderListPage";
import { DealerProductPriceMaintenancePage } from "../features/order/dealer/pages/DealerProductPriceMaintenancePage";
import { DealerPurchaseSaleAgreementDetailPage } from "../features/order/dealer/pages/DealerPurchaseSaleAgreementDetailPage";
import { DealerPurchaseSaleAgreementListPage } from "../features/order/dealer/pages/DealerPurchaseSaleAgreementListPage";
import { DistributorInventorySelfListPage } from "../features/order/distributor/pages/DistributorInventorySelfListPage";
import { DistributorPlatformOrderDetailPage } from "../features/order/distributor/pages/DistributorPlatformOrderDetailPage";
import { DistributorPlatformOrderListPage } from "../features/order/distributor/pages/DistributorPlatformOrderListPage";
import { DistributorReceivingAddressListPage } from "../features/order/distributor/pages/DistributorReceivingAddressListPage";

const pageRegistry: Record<string, ComponentType> = {
  "admin.contract.contract-list": ContractListPage,
  "admin.order.distributor-list": CustomerDistributorListPage,
  "admin.order.distributor-approval": CustomerDistributorApprovalPage,
  "admin.order.dealer-distributor-supply-relation-maintenance": DealerDistributorSupplyRelationPage,
  "admin.order.dealer-distributor-supply-relation-approval": DealerDistributorSupplyRelationApprovalPage,
  "admin.order.interception-release-application": InterceptionReleaseApplicationPage,
  "admin.order.e-distributor-list": EDistributorListPage,
  "admin.order.distributor-inventory-list": DistributorInventoryListPage,
  "admin.order.service-provider-list": ServiceProviderListPage,
  "admin.order.service-provider-inventory-list": ServiceProviderInventoryListPage,
  "admin.order.service-owner-maintenance": ServiceOwnerMaintenancePage,
  "admin.order.line-manager-maintenance": LineManagerMaintenancePage,
  "admin.order.distributor-manager-maintenance": DistributorManagerMaintenancePage,
  "admin.order.contract-signing-approval": ContractSigningApprovalPage,
  "admin.order.platform-config": PlatformConfigPage,
  "admin.order.product-price-maintenance": ProductPriceMaintenancePage,
  "admin.order.inventory-intercept-config": InventoryInterceptConfigPage,
  "admin.order.sold-to-list": SoldToListPage,
  "admin.order.ship-to-list": ShipToListPage,
  "admin.order.ship-to-mapping": ShipToMappingPage,
  "admin.order.platform-order-approval": PlatformOrderApprovalPage,
  "admin.order.platform-order-list": PlatformOrderListPage,
  "dealer.order.dealer-platform-order-list": DealerPlatformOrderListPage,
  "dealer.order.dealer-purchase-sale-agreement-list": DealerPurchaseSaleAgreementListPage,
  "dealer.order.dealer-product-price-maintenance": DealerProductPriceMaintenancePage,
  "distributor.order.distributor-order-list": DistributorPlatformOrderListPage,
  "distributor.order.distributor-receiving-address-list": DistributorReceivingAddressListPage,
  "distributor.order.distributor-inventory-list": DistributorInventorySelfListPage,
  "distributor.contract.distributor-contract-list": DistributorContractListPage,
};

const pageDetailRegistry: Record<string, ComponentType> = {
  "admin.order.contract-signing-approval": ContractSigningApprovalDetailPage,
  "admin.order.distributor-list": CustomerDistributorDetailPage,
  "admin.order.distributor-approval": CustomerDistributorApprovalDetailPage,
  "admin.order.interception-release-application": InterceptionReleaseApplicationDetailPage,
  "admin.order.platform-order-approval": PlatformOrderApprovalDetailPage,
  "admin.order.platform-order-list": PlatformOrderDetailPage,
  "dealer.order.dealer-platform-order-list": DealerPlatformOrderDetailPage,
  "dealer.order.dealer-purchase-sale-agreement-list": DealerPurchaseSaleAgreementDetailPage,
  "distributor.order.distributor-order-list": DistributorPlatformOrderDetailPage,
  "distributor.contract.distributor-contract-list": DistributorContractDetailPage,
};

export function resolvePageComponent(role: string, system: string, moduleId: string) {
  return pageRegistry[`${role}.${system}.${moduleId}`];
}

export function resolvePageDetailComponent(role: string, system: string, moduleId: string) {
  return pageDetailRegistry[`${role}.${system}.${moduleId}`];
}

export { pageRegistry };
