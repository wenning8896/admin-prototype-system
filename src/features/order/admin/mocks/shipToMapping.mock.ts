export type ShipToMappingRecord = {
  id: string;
  oldShipToCode: string;
  newShipToCode: string;
  createdAt: string;
};

export const shipToMappingSeedRecords: ShipToMappingRecord[] = [
  {
    id: "shipto-mapping-001",
    oldShipToCode: "OLD-SHIPTO-001",
    newShipToCode: "SHIPTO0001",
    createdAt: "2024-02-01 10:00",
  },
  {
    id: "shipto-mapping-002",
    oldShipToCode: "OLD-SHIPTO-002",
    newShipToCode: "SHIPTO0001",
    createdAt: "2024-02-03 14:20",
  },
];
