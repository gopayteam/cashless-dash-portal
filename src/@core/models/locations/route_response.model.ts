import { Route } from './route.model';

export interface RoutesResponse {
  status: number;
  message: string;
  data: Route[];
  totalRecords: number;
}
