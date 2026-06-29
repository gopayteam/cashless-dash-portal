export interface StageContact {
  stageId: number;
  stageName: string;
  phoneNumber: string;
}

export interface StageContactApiResponse {
  status: number;
  message: string;
  data: StageContact[];
  totalRecords: number;
}

export interface StageContactPayload {
  stageId: number;
  phoneNumber: string;
  entityId: string;
}

export interface UpdateStageContactPayload {
  phoneNumber: string;
}