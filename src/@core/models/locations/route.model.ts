export interface Route {
  routeId: number;
  startId: number;
  endId: number;
  startLocation: string;
  endLocation: string;
  direction: 'FORWARD' | 'REVERSE';
  points: any | null;
  fleetNumbers: any | null;
}
