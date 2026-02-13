export interface FleetCollectionModel {
  totalAmount: number;
  fleetNumber: string;
}

export interface FleetApiResponse {
  data: FleetCollectionModel[];
  totalElements: number;
  page: number;
  size: number;
}
