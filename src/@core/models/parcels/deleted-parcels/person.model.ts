export interface Person {
  id: number;
  softDelete: boolean;
  entityId: string;
  name: string;
  phoneNumber: string;
  idNumber: string | null;
  personType: 'SENDER' | 'RECEIVER';
}
