// Parcel Manager model
export interface ParcelManager {
  username: string;       // unique identifier, often phone number
  userName: string;       // parcel manager's display name
  userPhone: string;      // parcel manager's phone number
  parcels: number;        // number of parcels handled
  cash: number;           // total cash transactions
  cashless: number;       // total cashless transactions
  totalAmount: number;    // sum of cash + cashless
  expense: number;        // expenses incurred
  netAmount: number;      // totalAmount - expense
}

