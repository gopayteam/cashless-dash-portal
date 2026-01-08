const formatLargeNumber = (value: number): string => {
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + 'B';
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M';
  return value.toLocaleString('en-KE');
};

// mapPaymentRecords(records: PaymentRecord[]): PaymentRecordVM[] {
//   return records.map((r) => ({
//     ...r,
//     createdAtFormatted: formatDateTime(r.createdAt),
//     updatedAtFormatted: formatDateTime(r.updatedAt),
//   }));
// }

// mapPaymentRecords2(records: PaymentRecord[]): PaymentRecordVM[] {
//   return records.map((r) => ({
//     ...r,
//     createdAtFormatted: formatRelativeTime(r.createdAt),
//     updatedAtFormatted: formatRelativeTime(r.updatedAt),
//   }));
// }
