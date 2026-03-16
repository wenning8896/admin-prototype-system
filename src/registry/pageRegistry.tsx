import type { ComponentType } from "react";
import { ContractApprovalDetailPage } from "../features/contract/admin/pages/ContractApprovalDetailPage";
import { ContractApprovalPage } from "../features/contract/admin/pages/ContractApprovalPage";
import { ContractDetailPage } from "../features/contract/admin/pages/ContractDetailPage";
import { ContractEditableTimeLockPage } from "../features/contract/admin/pages/ContractEditableTimeLockPage";
import { ContractHistoryVersionPage } from "../features/contract/admin/pages/ContractHistoryVersionPage";
import { ContractListPage } from "../features/contract/admin/pages/ContractListPage";
import { ContractWorkbenchPage } from "../features/contract/admin/pages/ContractWorkbenchPage";
import { HospitalComplianceMaintenancePage } from "../features/contract/admin/pages/HospitalComplianceMaintenancePage";
import { HospitalProcurementProductListPage } from "../features/contract/admin/pages/HospitalProcurementProductListPage";
import { HospitalReceiverListPage } from "../features/contract/admin/pages/HospitalReceiverListPage";
import { SignReceiptApprovalPage } from "../features/contract/admin/pages/SignReceiptApprovalPage";
import { SignReceiptApprovalDetailPage } from "../features/contract/admin/pages/SignReceiptApprovalDetailPage";
import { SignReceiptStatisticsPage } from "../features/contract/admin/pages/SignReceiptStatisticsPage";
import { SignReceiptUploadTimeLockPage } from "../features/contract/admin/pages/SignReceiptUploadTimeLockPage";
import { DealerContractDetailPage } from "../features/contract/dealer/pages/DealerContractDetailPage";
import { DealerContractListPage } from "../features/contract/dealer/pages/DealerContractListPage";
import { DealerSignReceiptUploadDetailPage } from "../features/contract/dealer/pages/DealerSignReceiptUploadDetailPage";
import { DealerContractWorkbenchPage } from "../features/contract/dealer/pages/DealerContractWorkbenchPage";
import { DealerSignReceiptUploadPage } from "../features/contract/dealer/pages/DealerSignReceiptUploadPage";
import { DistributorContractDetailPage } from "../features/contract/distributor/pages/DistributorContractDetailPage";
import { DistributorContractListPage } from "../features/contract/distributor/pages/DistributorContractListPage";
import { CustomerDistributorApprovalDetailPage } from "../features/order/admin/pages/CustomerDistributorApprovalDetailPage";
import { CustomerDistributorApprovalPage } from "../features/order/admin/pages/CustomerDistributorApprovalPage";
import { ContractSigningApprovalDetailPage } from "../features/order/admin/pages/ContractSigningApprovalDetailPage";
import { ContractSigningApprovalPage } from "../features/order/admin/pages/ContractSigningApprovalPage";
import { ContractSigningListDetailPage } from "../features/order/admin/pages/ContractSigningListDetailPage";
import { ContractSigningListPage } from "../features/order/admin/pages/ContractSigningListPage";
import { CustomerDistributorDetailPage } from "../features/order/admin/pages/CustomerDistributorDetailPage";
import { CustomerDistributorListPage } from "../features/order/admin/pages/CustomerDistributorListPage";
import { DealerDistributorSupplyRelationApprovalPage } from "../features/order/admin/pages/DealerDistributorSupplyRelationApprovalPage";
import { DealerDistributorSupplyRelationPage } from "../features/order/admin/pages/DealerDistributorSupplyRelationPage";
import { EDistributorListPage } from "../features/order/admin/pages/EDistributorListPage";
import { InventoryInterceptConfigPage } from "../features/order/admin/pages/InventoryInterceptConfigPage";
import { InterceptionReleaseApplicationDetailPage } from "../features/order/admin/pages/InterceptionReleaseApplicationDetailPage";
import { InterceptionReleaseApplicationPage } from "../features/order/admin/pages/InterceptionReleaseApplicationPage";
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
  "admin.contract.contract-workbench": ContractWorkbenchPage,
  "admin.contract.contract-approval": ContractApprovalPage,
  "admin.contract.hospital-procurement-product-list": HospitalProcurementProductListPage,
  "admin.contract.hospital-compliance-maintenance": HospitalComplianceMaintenancePage,
  "admin.contract.contract-history-version": ContractHistoryVersionPage,
  "admin.contract.contract-editable-time-lock": ContractEditableTimeLockPage,
  "admin.contract.sign-receipt-approval": SignReceiptApprovalPage,
  "admin.contract.hospital-receiver-list": HospitalReceiverListPage,
  "admin.contract.sign-receipt-upload-time-lock": SignReceiptUploadTimeLockPage,
  "admin.contract.sign-receipt-statistics": SignReceiptStatisticsPage,
  "admin.order.distributor-list": CustomerDistributorListPage,
  "admin.order.distributor-approval": CustomerDistributorApprovalPage,
  "admin.order.dealer-distributor-supply-relation-maintenance": DealerDistributorSupplyRelationPage,
  "admin.order.dealer-distributor-supply-relation-approval": DealerDistributorSupplyRelationApprovalPage,
  "admin.order.interception-release-application": InterceptionReleaseApplicationPage,
  "admin.order.e-distributor-list": EDistributorListPage,
  "admin.order.contract-signing-list": ContractSigningListPage,
  "admin.order.contract-signing-approval": ContractSigningApprovalPage,
  "admin.order.distributor-inventory-list": DistributorInventoryListPage,
  "admin.order.service-provider-list": ServiceProviderListPage,
  "admin.order.service-provider-inventory-list": ServiceProviderInventoryListPage,
  "admin.order.service-owner-maintenance": ServiceOwnerMaintenancePage,
  "admin.order.line-manager-maintenance": LineManagerMaintenancePage,
  "admin.order.distributor-manager-maintenance": DistributorManagerMaintenancePage,
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
  "dealer.contract.dealer-contract-workbench": DealerContractWorkbenchPage,
  "dealer.contract.dealer-contract-list": DealerContractListPage,
  "dealer.contract.dealer-sign-receipt-upload": DealerSignReceiptUploadPage,
  "distributor.order.distributor-order-list": DistributorPlatformOrderListPage,
  "distributor.order.distributor-receiving-address-list": DistributorReceivingAddressListPage,
  "distributor.order.distributor-inventory-list": DistributorInventorySelfListPage,
  "distributor.contract.distributor-contract-list": DistributorContractListPage,
};

const pageDetailRegistry: Record<string, ComponentType> = {
  "admin.contract.contract-list": ContractDetailPage,
  "admin.contract.contract-approval": ContractApprovalDetailPage,
  "admin.contract.sign-receipt-approval": SignReceiptApprovalDetailPage,
  "admin.order.distributor-list": CustomerDistributorDetailPage,
  "admin.order.distributor-approval": CustomerDistributorApprovalDetailPage,
  "admin.order.contract-signing-approval": ContractSigningApprovalDetailPage,
  "admin.order.contract-signing-list": ContractSigningListDetailPage,
  "admin.order.interception-release-application": InterceptionReleaseApplicationDetailPage,
  "admin.order.platform-order-approval": PlatformOrderApprovalDetailPage,
  "admin.order.platform-order-list": PlatformOrderDetailPage,
  "dealer.order.dealer-platform-order-list": DealerPlatformOrderDetailPage,
  "dealer.order.dealer-purchase-sale-agreement-list": DealerPurchaseSaleAgreementDetailPage,
  "dealer.contract.dealer-contract-list": DealerContractDetailPage,
  "dealer.contract.dealer-sign-receipt-upload": DealerSignReceiptUploadDetailPage,
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
