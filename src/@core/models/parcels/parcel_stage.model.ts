// ParcelStage.ts
export interface ParcelStage {
  parcelDate: string;   // e.g. "2026-01-10"
  parcels: number;      // number of parcels
  cash: number;         // cash amount
  cashless: number;     // cashless amount
  totalCost: number;    // total cost
  stage: string;        // stage name
}

