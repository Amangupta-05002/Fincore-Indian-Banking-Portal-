export type AccountType = 'SAVINGS' | 'CURRENT' | 'SALARY' | 'FIXED_DEPOSIT' | 'CHECKING' | 'BUSINESS' | 'INVESTMENT';
export type AccountStatus = 'ACTIVE' | 'DORMANT' | 'FROZEN';
export type TransactionType = 'TRANSFER' | 'DEPOSIT' | 'WITHDRAWAL' | 'BILL_PAYMENT' | 'INTEREST_CREDIT';
export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED';
export type TransferMode = 'IMPS' | 'NEFT' | 'RTGS' | 'INTERNAL';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'CUSTOMER' | 'ADMIN' | 'TELLER';
  phone?: string;
  cifNumber?: string; // Indian Banking Customer Information File ID
  panMasked?: string; // e.g. ABCDE****F
  avatarUrl?: string;
  createdAt: string;
}

export interface Account {
  id: string;
  accountNumber: string;
  accountType: AccountType;
  currency: string; // 'INR'
  balance: number;
  availableBalance: number;
  status: AccountStatus;
  ifscCode: string; // Indian Financial System Code (e.g. FINC0001004)
  micrCode?: string; // 9-digit MICR code
  branchName?: string; // e.g. Connaught Place Branch, New Delhi
  routingNumber?: string; // compatibility alias for ifscCode
  iban?: string;
  swiftBic?: string;
  interestRate?: number;
  overdraftLimit?: number;
  nickname?: string;
  nomineeRegistered?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  transactionReference: string; // UTR or Reference number (e.g. FINC2026101599812)
  sourceAccountId: string;
  sourceAccountNumber: string;
  sourceAccountType?: AccountType;
  destinationAccountNumber: string;
  beneficiaryName: string;
  beneficiaryBank?: string;
  beneficiaryIfsc?: string;
  transferMode?: TransferMode;
  amount: number;
  currency: string;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  timestamp: string;
  valueDate?: string;
  category?: string;
  fee: number;
  balanceAfter?: number;
  channel?: 'NET_BANKING' | 'MOBILE_APP' | 'IMPS' | 'NEFT' | 'RTGS' | 'UPI' | 'ONLINE_PORTAL' | 'ATM';
}

export interface Beneficiary {
  id: string;
  name: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName?: string;
  nickname?: string;
  email?: string;
  phone?: string;
  accountType?: 'SAVINGS' | 'CURRENT';
  transferLimit?: number;
  status?: 'ACTIVE' | 'COOLING_OFF' | 'PENDING';
  addedAt?: string;
  routingNumber?: string; // backward-compat alias
}

export interface TransferRequest {
  sourceAccountId: string;
  destinationAccountNumber: string;
  beneficiaryName: string;
  beneficiaryBankCode?: string;
  beneficiaryIfsc?: string;
  transferMode: TransferMode;
  amount: number;
  description?: string;
  idempotencyKey: string;
}

export interface TransferResponse {
  transactionReference: string;
  status: TransactionStatus;
  message: string;
  timestamp: string;
  amount: number;
  currency: string;
  fee: number;
  transferMode?: TransferMode;
  sourceAccountNumber: string;
  destinationAccountNumber: string;
  beneficiaryName: string;
  beneficiaryIfsc?: string;
  sourceAvailableBalance: number;
}

export interface AccountStatement {
  account: Account;
  startDate: string;
  endDate: string;
  openingBalance: number;
  closingBalance: number;
  totalCredits: number;
  totalDebits: number;
  netCashflow: number;
  generatedAt: string;
  transactions: Transaction[];
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
  timestamp: string;
  path?: string;
  details?: string[];
}

export interface BackendHealth {
  connected: boolean;
  url: string;
  latencyMs?: number;
  springBootVersion?: string;
  databaseStatus?: 'CONNECTED' | 'DISCONNECTED' | 'UNKNOWN';
  checkedAt: string;
  rawResponse?: unknown;
}
