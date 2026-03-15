export type ReceivingAddressRecord = {
  id: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detailAddress: string;
  postalCode: string;
};

export const receivingAddressSeedRecords: ReceivingAddressRecord[] = [
  {
    id: "addr-001",
    name: "何齐",
    phone: "13501762348",
    province: "吉林省",
    city: "长春市",
    district: "朝阳区",
    detailAddress: "人民大街 2188 号 A 座 1203 室",
    postalCode: "130012",
  },
  {
    id: "addr-002",
    name: "周睿",
    phone: "13501760086",
    province: "吉林省",
    city: "吉林市",
    district: "船营区",
    detailAddress: "解放中路 66 号 5 单元 302 室",
    postalCode: "132011",
  },
];
