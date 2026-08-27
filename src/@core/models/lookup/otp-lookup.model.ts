export interface OtpLookupDto {
  id: number;
  phoneNumber: string;
  token: string;
  tokenRefId: string;
  expiresAt: string;
  createdAt: string;
  confirmedAt?: string | null;
  status: 'ACTIVE' | 'CONFIRMED' | 'EXPIRED' | string;
}

export interface OtpSearchFilters {
  phoneNumber?: string;
  token?: string;
  tokenRefId?: string;
  status?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  page?: number;
  size?: number;
  sort?: string;
  direction?: string;
}
