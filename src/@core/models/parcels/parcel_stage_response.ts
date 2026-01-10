import { ParcelStage } from "./parcel_stage.model";


export interface ParcelStageApiResponse {
  status: number;              // e.g. 0
  message: string;             // e.g. "Success!"
  data: ParcelStage[];         // list of parcel stages
  totalRecords: number;        // e.g. 79
}
