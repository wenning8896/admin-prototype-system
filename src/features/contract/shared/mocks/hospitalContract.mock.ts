export type ContractApprovalStatus = "草稿" | "审核中" | "审核通过" | "审核驳回";
export type ContractLifeStatus = "有效" | "无效";
export type ContractActionType = "新建合同" | "续签" | "补充SKU" | "关闭合同";

export type HospitalContractProduct = {
  id: string;
  productCode: string;
  productName: string;
  suggestedPrice: number;
  price?: number;
};

export type HospitalContractReceiver = {
  id: string;
  receiverName: string;
  receiverCode: string;
};

export type ContractApprovalHistory = {
  id: string;
  nodeName: string;
  decision: "提交申请" | "审批通过" | "审批驳回";
  roleLabel: string;
  operatorName: string;
  account: string;
  actedAt: string;
  remark?: string;
  attachmentName?: string;
};

export type ContractVersionRecord = {
  id: string;
  versionLabel: string;
  actionType: ContractActionType;
  createdAt: string;
  operatorName: string;
  exportFileName: string;
};

export type HospitalContractRecord = {
  id: string;
  contractNo: string;
  approvalStatus: ContractApprovalStatus;
  lifeStatus: ContractLifeStatus;
  pendingAction?: ContractActionType;
  latestActionType?: ContractActionType;
  currentApprovalNode?: string;
  submitterName: string;
  submitterAccount: string;
  dmsHospitalCode: string;
  dmsHospitalName: string;
  dmsHospitalCooperationStatus: "Y" | "N";
  signHospitalEtmsId: string;
  useProductEtmsId: string;
  dealerCode: string;
  dealerName: string;
  region: string;
  cg: string;
  province: string;
  dmsHospitalAddress: string;
  deliveryAddress: string;
  contractForm: string;
  transferType: string;
  contractDepartmentType: string;
  signatoryFullName: string;
  sealName: string;
  paymentAccount: string;
  accountHolderName: string;
  bankName: string;
  signedAt: string;
  expiredAt: string;
  renewalType: string;
  autoRenewYears: number;
  renewedDuration: string;
  contractAttachmentName: string;
  thirdPartyEffectiveAt: string;
  authorizationMode: string;
  authorizationEffectiveAt: string;
  authorizationExpiredAt: string;
  authorizedReceiver: string;
  receivers: HospitalContractReceiver[];
  products: HospitalContractProduct[];
  createdAt: string;
  updatedAt: string;
  approvalHistory: ContractApprovalHistory[];
  versions: ContractVersionRecord[];
};

export type HospitalContractDetailValues = {
  dealerCode: string;
  dealerName: string;
  region: string;
  cg: string;
  province: string;
  dmsHospitalCode: string;
  dmsHospitalName: string;
  dmsHospitalCooperationStatus: "Y" | "N";
  signHospitalEtmsId: string;
  useProductEtmsId: string;
  dmsHospitalAddress: string;
  deliveryAddress: string;
  contractForm: string;
  transferType: string;
  contractDepartmentType: string;
  signatoryFullName: string;
  sealName: string;
  paymentAccount: string;
  accountHolderName: string;
  bankName: string;
  signedAt: string;
  expiredAt: string;
  renewalType: string;
  autoRenewYears: number;
  renewedDuration: string;
  contractAttachmentName: string;
  thirdPartyEffectiveAt: string;
  authorizationMode: string;
  authorizationEffectiveAt: string;
  authorizationExpiredAt: string;
  authorizedReceiver: string;
  receivers: HospitalContractReceiver[];
  products: HospitalContractProduct[];
};

export const contractApprovalNodeSequence = ["区域经理审批", "法务审批", "合同管理员审批"];

export const contractSeedRecords: HospitalContractRecord[] = [
  {
    id: "contract-1",
    contractNo: "HT-202603-001",
    approvalStatus: "审核通过",
    lifeStatus: "有效",
    latestActionType: "新建合同",
    submitterName: "王敏",
    submitterAccount: "dealer001",
    dmsHospitalCode: "HSP-DMS-001",
    dmsHospitalName: "上海第一人民医院",
    dmsHospitalCooperationStatus: "Y",
    signHospitalEtmsId: "ETMS-S-001",
    useProductEtmsId: "ETMS-U-001",
    dealerCode: "D1917070",
    dealerName: "辽宁嘉丰进出口贸易有限公司",
    region: "华东大区",
    cg: "上海",
    province: "上海市",
    dmsHospitalAddress: "上海市黄浦区中山南路 100 号",
    deliveryAddress: "上海市黄浦区院采收货点 1 号",
    contractForm: "公对公合同-医院公章",
    transferType: "公对公转账（医院）",
    contractDepartmentType: "药剂科",
    signatoryFullName: "上海第一人民医院",
    sealName: "上海第一人民医院合同章",
    paymentAccount: "3100000123456789",
    accountHolderName: "上海第一人民医院",
    bankName: "中国工商银行上海分行",
    signedAt: "2026-03-01",
    expiredAt: "2027-02-28",
    renewalType: "自动延期",
    autoRenewYears: 1,
    renewedDuration: "0 次",
    contractAttachmentName: "上海第一人民医院院采合同_V1.pdf",
    thirdPartyEffectiveAt: "2026-03-01",
    authorizationMode: "医院授权第三方",
    authorizationEffectiveAt: "2026-03-01",
    authorizationExpiredAt: "2027-02-28",
    authorizedReceiver: "赵医生",
    receivers: [
      { id: "receiver-1", receiverName: "赵医生", receiverCode: "RCV-001" },
      { id: "receiver-2", receiverName: "钱老师", receiverCode: "RCV-002" },
    ],
    products: [
      { id: "product-1", productCode: "P-1001", productName: "启赋配方奶粉 1 段", suggestedPrice: 328, price: 328 },
      { id: "product-2", productCode: "P-1002", productName: "启赋配方奶粉 2 段", suggestedPrice: 338, price: 338 },
    ],
    createdAt: "2026-03-01 10:00",
    updatedAt: "2026-03-03 16:40",
    approvalHistory: [
      {
        id: "history-1",
        nodeName: "经销商提交",
        decision: "提交申请",
        roleLabel: "经销商",
        operatorName: "王敏",
        account: "dealer001",
        actedAt: "2026-03-01 10:00",
        remark: "新建院采合同。",
      },
      {
        id: "history-2",
        nodeName: "区域经理审批",
        decision: "审批通过",
        roleLabel: "管理员",
        operatorName: "刘波",
        account: "admin",
        actedAt: "2026-03-02 09:20",
        remark: "业务信息确认无误。",
      },
      {
        id: "history-3",
        nodeName: "法务审批",
        decision: "审批通过",
        roleLabel: "管理员",
        operatorName: "宋洁",
        account: "admin",
        actedAt: "2026-03-02 13:30",
        remark: "法务审核通过。",
      },
      {
        id: "history-4",
        nodeName: "合同管理员审批",
        decision: "审批通过",
        roleLabel: "管理员",
        operatorName: "徐衡",
        account: "admin",
        actedAt: "2026-03-03 16:40",
        remark: "合同生效。",
      },
    ],
    versions: [
      {
        id: "version-1",
        versionLabel: "V1.0",
        actionType: "新建合同",
        createdAt: "2026-03-03 16:40",
        operatorName: "徐衡",
        exportFileName: "HT-202603-001_V1.0.pdf",
      },
    ],
  },
  {
    id: "contract-2",
    contractNo: "HT-202603-002",
    approvalStatus: "审核中",
    lifeStatus: "有效",
    pendingAction: "新建合同",
    latestActionType: "新建合同",
    currentApprovalNode: "法务审批",
    submitterName: "陈雪",
    submitterAccount: "dealer002",
    dmsHospitalCode: "HSP-DMS-002",
    dmsHospitalName: "北京儿童医院",
    dmsHospitalCooperationStatus: "Y",
    signHospitalEtmsId: "ETMS-S-002",
    useProductEtmsId: "ETMS-U-002",
    dealerCode: "D5060011",
    dealerName: "广州市康盈贸易有限公司",
    region: "华北大区",
    cg: "北京",
    province: "北京市",
    dmsHospitalAddress: "北京市西城区南礼士路 56 号",
    deliveryAddress: "北京市西城区住院部收货点",
    contractForm: "公对公合同-科室章",
    transferType: "公对公转账（医院）",
    contractDepartmentType: "营养科",
    signatoryFullName: "北京儿童医院",
    sealName: "北京儿童医院营养科章",
    paymentAccount: "1100000456789012",
    accountHolderName: "北京儿童医院",
    bankName: "中国银行北京分行",
    signedAt: "2026-03-05",
    expiredAt: "2027-03-04",
    renewalType: "无自动延期",
    autoRenewYears: 0,
    renewedDuration: "0 次",
    contractAttachmentName: "北京儿童医院院采合同_草稿.pdf",
    thirdPartyEffectiveAt: "2026-03-05",
    authorizationMode: "医院授权第三方",
    authorizationEffectiveAt: "2026-03-05",
    authorizationExpiredAt: "2027-03-04",
    authorizedReceiver: "李老师",
    receivers: [{ id: "receiver-3", receiverName: "李老师", receiverCode: "RCV-003" }],
    products: [{ id: "product-3", productCode: "P-2001", productName: "启赋敏适", suggestedPrice: 398, price: 398 }],
    createdAt: "2026-03-05 11:30",
    updatedAt: "2026-03-06 09:15",
    approvalHistory: [
      {
        id: "history-5",
        nodeName: "经销商提交",
        decision: "提交申请",
        roleLabel: "经销商",
        operatorName: "陈雪",
        account: "dealer002",
        actedAt: "2026-03-05 11:30",
        remark: "提交新建合同。",
      },
      {
        id: "history-6",
        nodeName: "区域经理审批",
        decision: "审批通过",
        roleLabel: "管理员",
        operatorName: "刘波",
        account: "admin",
        actedAt: "2026-03-06 09:15",
        remark: "区域经理审批通过。",
      },
    ],
    versions: [],
  },
  {
    id: "contract-3",
    contractNo: "HT-202603-003",
    approvalStatus: "审核驳回",
    lifeStatus: "有效",
    latestActionType: "新建合同",
    submitterName: "王敏",
    submitterAccount: "dealer001",
    dmsHospitalCode: "HSP-DMS-003",
    dmsHospitalName: "广州妇儿医院",
    dmsHospitalCooperationStatus: "N",
    signHospitalEtmsId: "ETMS-S-003",
    useProductEtmsId: "ETMS-U-003",
    dealerCode: "D1917070",
    dealerName: "辽宁嘉丰进出口贸易有限公司",
    region: "华南大区",
    cg: "广州",
    province: "广东省",
    dmsHospitalAddress: "广州市越秀区人民中路 200 号",
    deliveryAddress: "广州市院采仓",
    contractForm: "公对公合同-医院授权第三方",
    transferType: "公对公转账（医院授权第三方）",
    contractDepartmentType: "采购科",
    signatoryFullName: "广州妇儿医院",
    sealName: "广州妇儿医院采购章",
    paymentAccount: "4400000098765432",
    accountHolderName: "广州妇儿医院",
    bankName: "招商银行广州分行",
    signedAt: "2026-03-08",
    expiredAt: "2027-03-07",
    renewalType: "自动延期",
    autoRenewYears: 1,
    renewedDuration: "0 次",
    contractAttachmentName: "广州妇儿医院院采合同_补件版.pdf",
    thirdPartyEffectiveAt: "2026-03-08",
    authorizationMode: "医院授权第三方",
    authorizationEffectiveAt: "2026-03-08",
    authorizationExpiredAt: "2027-03-07",
    authorizedReceiver: "邱护士长",
    receivers: [{ id: "receiver-4", receiverName: "邱护士长", receiverCode: "RCV-004" }],
    products: [{ id: "product-4", productCode: "P-3001", productName: "启赋有机 3 段", suggestedPrice: 368, price: 368 }],
    createdAt: "2026-03-08 14:20",
    updatedAt: "2026-03-09 17:50",
    approvalHistory: [
      {
        id: "history-7",
        nodeName: "经销商提交",
        decision: "提交申请",
        roleLabel: "经销商",
        operatorName: "王敏",
        account: "dealer001",
        actedAt: "2026-03-08 14:20",
        remark: "提交新建合同。",
      },
      {
        id: "history-8",
        nodeName: "区域经理审批",
        decision: "审批驳回",
        roleLabel: "管理员",
        operatorName: "刘波",
        account: "admin",
        actedAt: "2026-03-09 17:50",
        remark: "医院授权文件缺失，请补充后重新提交。",
      },
    ],
    versions: [],
  },
  {
    id: "contract-4",
    contractNo: "HT-202512-018",
    approvalStatus: "审核通过",
    lifeStatus: "无效",
    latestActionType: "关闭合同",
    submitterName: "王敏",
    submitterAccount: "dealer001",
    dmsHospitalCode: "HSP-DMS-004",
    dmsHospitalName: "苏州大学附属医院",
    dmsHospitalCooperationStatus: "Y",
    signHospitalEtmsId: "ETMS-S-004",
    useProductEtmsId: "ETMS-U-004",
    dealerCode: "D1917070",
    dealerName: "辽宁嘉丰进出口贸易有限公司",
    region: "华东大区",
    cg: "苏州",
    province: "江苏省",
    dmsHospitalAddress: "苏州市姑苏区干将西路 188 号",
    deliveryAddress: "苏州市姑苏区住院部",
    contractForm: "公对公合同-医院公章",
    transferType: "公对公转账（医院）",
    contractDepartmentType: "儿科",
    signatoryFullName: "苏州大学附属医院",
    sealName: "苏州大学附属医院合同章",
    paymentAccount: "3200000111222333",
    accountHolderName: "苏州大学附属医院",
    bankName: "建设银行苏州分行",
    signedAt: "2025-12-10",
    expiredAt: "2026-12-09",
    renewalType: "无自动延期",
    autoRenewYears: 0,
    renewedDuration: "1 次",
    contractAttachmentName: "苏州大学附属医院续签合同.pdf",
    thirdPartyEffectiveAt: "2025-12-10",
    authorizationMode: "医院授权第三方",
    authorizationEffectiveAt: "2025-12-10",
    authorizationExpiredAt: "2026-12-09",
    authorizedReceiver: "周主任",
    receivers: [{ id: "receiver-5", receiverName: "周主任", receiverCode: "RCV-005" }],
    products: [{ id: "product-5", productCode: "P-1001", productName: "启赋配方奶粉 1 段", suggestedPrice: 328, price: 328 }],
    createdAt: "2025-12-10 08:45",
    updatedAt: "2026-02-20 19:00",
    approvalHistory: [
      {
        id: "history-9",
        nodeName: "经销商提交",
        decision: "提交申请",
        roleLabel: "经销商",
        operatorName: "王敏",
        account: "dealer001",
        actedAt: "2026-02-18 14:00",
        remark: "发起关闭申请。",
      },
      {
        id: "history-10",
        nodeName: "区域经理审批",
        decision: "审批通过",
        roleLabel: "管理员",
        operatorName: "刘波",
        account: "admin",
        actedAt: "2026-02-19 10:00",
        remark: "同意关闭。",
      },
      {
        id: "history-11",
        nodeName: "法务审批",
        decision: "审批通过",
        roleLabel: "管理员",
        operatorName: "宋洁",
        account: "admin",
        actedAt: "2026-02-20 11:30",
        remark: "法务审核通过。",
      },
      {
        id: "history-12",
        nodeName: "合同管理员审批",
        decision: "审批通过",
        roleLabel: "管理员",
        operatorName: "徐衡",
        account: "admin",
        actedAt: "2026-02-20 19:00",
        remark: "合同已关闭。",
      },
    ],
    versions: [
      {
        id: "version-2",
        versionLabel: "V2.0",
        actionType: "关闭合同",
        createdAt: "2026-02-20 19:00",
        operatorName: "徐衡",
        exportFileName: "HT-202512-018_V2.0.pdf",
      },
    ],
  },
];
