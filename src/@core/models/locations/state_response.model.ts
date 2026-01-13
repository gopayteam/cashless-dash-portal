import { Stage } from './stage.model';

export interface StagesResponse {
  status: number;
  message: string;
  data: Stage[];
  totalRecords: number;
}
