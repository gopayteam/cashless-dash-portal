type ApprovalAction = 'APPROVED' | 'REJECTED';

interface ApprovalResponse {
  status: number;
  message: string;
  data: any;
  totalRecords: number;
}
