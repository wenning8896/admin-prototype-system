export type SignReceiptStatus = "待上传" | "待审批" | "审批通过" | "审批驳回";

export type SignReceiptHistory = {
  id: string;
  nodeName: string;
  decision: "提交签收单" | "审批通过" | "审批驳回";
  roleLabel: string;
  operatorName: string;
  account: string;
  actedAt: string;
  remark?: string;
  attachmentName?: string;
};

export type SignReceiptRecord = {
  id: string;
  contractId: string;
  contractNo: string;
  dealerCode: string;
  dealerName: string;
  dmsHospitalCode: string;
  dmsHospitalName: string;
  procurementType: "直采" | "三方";
  contractLifeStatus: "待生效" | "有效" | "失效" | "关闭";
  receiverName: string;
  receiverId: string;
  status: SignReceiptStatus;
  approvalNode?: string;
  submitterName?: string;
  submitterAccount?: string;
  uploadedAt?: string;
  receiptAttachmentName?: string;
  detailAttachmentName?: string;
  remark?: string;
  approvalHistory: SignReceiptHistory[];
};

export const signReceiptApprovalNodeSequence = ["签收单审批"];
