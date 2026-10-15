import { Account, Transaction, User, Beneficiary, AccountStatement } from '../types';

export const DEMO_USER: User = {
  id: 'usr_fincore_in_01',
  username: 'rohan.sharma',
  email: 'rohan.sharma@example.in',
  fullName: 'Rohan Sharma',
  role: 'CUSTOMER',
  phone: '+91 98765 43210',
  cifNumber: 'CIF88390192',
  panMasked: 'ABCPS****K',
  createdAt: '2025-01-15T09:30:00Z',
};

export const DEMO_ACCOUNTS: Account[] = [
  {
    id: 'acc_sav_001',
    accountNumber: '501004928172',
    accountType: 'SAVINGS',
    currency: 'INR',
    balance: 184520.50,
    availableBalance: 182520.50,
    status: 'ACTIVE',
    ifscCode: 'FINC0001004',
    micrCode: '110992004',
    branchName: 'Connaught Place Branch, New Delhi',
    routingNumber: 'FINC0001004',
    interestRate: 3.50,
    overdraftLimit: 0,
    nickname: 'Primary Savings Account',
    nomineeRegistered: true,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2026-10-15T06:15:00Z',
  },
  {
    id: 'acc_cur_002',
    accountNumber: '502008491024',
    accountType: 'CURRENT',
    currency: 'INR',
    balance: 492300.00,
    availableBalance: 485300.00,
    status: 'ACTIVE',
    ifscCode: 'FINC0001004',
    micrCode: '110992004',
    branchName: 'Connaught Place Branch, New Delhi',
    routingNumber: 'FINC0001004',
    interestRate: 0.00,
    overdraftLimit: 100000.00,
    nickname: 'Business Operations Current A/c',
    nomineeRegistered: true,
    createdAt: '2025-02-10T14:20:00Z',
    updatedAt: '2026-10-15T07:30:00Z',
  },
  {
    id: 'acc_fd_003',
    accountNumber: '503001928475',
    accountType: 'FIXED_DEPOSIT',
    currency: 'INR',
    balance: 1000000.00,
    availableBalance: 1000000.00,
    status: 'ACTIVE',
    ifscCode: 'FINC0001004',
    micrCode: '110992004',
    branchName: 'Connaught Place Branch, New Delhi',
    routingNumber: 'FINC0001004',
    interestRate: 7.10,
    overdraftLimit: 0,
    nickname: 'Tax Saver Fixed Deposit (5 Yrs)',
    nomineeRegistered: true,
    createdAt: '2025-03-01T11:45:00Z',
    updatedAt: '2026-10-15T00:00:00Z',
  },
];

export const DEMO_BENEFICIARIES: Beneficiary[] = [
  {
    id: 'ben_001',
    name: 'Ananya Verma',
    accountNumber: '301928471920',
    ifscCode: 'SBIN0000691',
    bankName: 'State Bank of India',
    branchName: 'Parliament Street, New Delhi',
    nickname: 'Ananya (Sister)',
    phone: '+91 98112 34567',
    accountType: 'SAVINGS',
    transferLimit: 200000,
    status: 'ACTIVE',
    addedAt: '2025-04-10',
    routingNumber: 'SBIN0000691',
  },
  {
    id: 'ben_002',
    name: 'Rajesh Kumar Gupta',
    accountNumber: '918273645019',
    ifscCode: 'HDFC0000060',
    bankName: 'HDFC Bank Ltd',
    branchName: 'Fort Branch, Mumbai',
    nickname: 'Rajesh (Vendor)',
    phone: '+91 98220 99881',
    accountType: 'CURRENT',
    transferLimit: 500000,
    status: 'ACTIVE',
    addedAt: '2025-06-20',
    routingNumber: 'HDFC0000060',
  },
  {
    id: 'ben_003',
    name: 'Tata Power Delhi Distribution Ltd',
    accountNumber: '100293847561',
    ifscCode: 'ICIC0000007',
    bankName: 'ICICI Bank Ltd',
    branchName: 'BKC Branch, Mumbai',
    nickname: 'Electricity Utility A/c',
    accountType: 'CURRENT',
    transferLimit: 50000,
    status: 'ACTIVE',
    addedAt: '2025-05-15',
    routingNumber: 'ICIC0000007',
  },
];

export const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_001',
    transactionReference: 'FINC20261015091823',
    sourceAccountId: 'acc_sav_001',
    sourceAccountNumber: '501004928172',
    sourceAccountType: 'SAVINGS',
    destinationAccountNumber: '301928471920',
    beneficiaryName: 'Ananya Verma',
    beneficiaryBank: 'State Bank of India',
    beneficiaryIfsc: 'SBIN0000691',
    transferMode: 'IMPS',
    amount: 15000.00,
    currency: 'INR',
    type: 'TRANSFER',
    status: 'COMPLETED',
    description: 'Family maintenance allowance (IMPS P2A)',
    timestamp: '2026-10-15T09:18:23Z',
    valueDate: '2026-10-15',
    category: 'Family Transfer',
    fee: 0.00,
    balanceAfter: 184520.50,
    channel: 'IMPS',
  },
  {
    id: 'tx_002',
    transactionReference: 'NEFTN261014002918',
    sourceAccountId: 'acc_sav_001',
    sourceAccountNumber: '984029110034',
    destinationAccountNumber: '501004928172',
    beneficiaryName: 'Infosys BPM Technologies',
    beneficiaryBank: 'FinCore Bank',
    beneficiaryIfsc: 'FINC0001004',
    transferMode: 'NEFT',
    amount: 112500.00,
    currency: 'INR',
    type: 'DEPOSIT',
    status: 'COMPLETED',
    description: 'Monthly Salary Credit for Sep 2026',
    timestamp: '2026-10-14T08:30:00Z',
    valueDate: '2026-10-14',
    category: 'Salary',
    fee: 0.00,
    balanceAfter: 199520.50,
    channel: 'NEFT',
  },
  {
    id: 'tx_003',
    transactionReference: 'FINC20261013143011',
    sourceAccountId: 'acc_cur_002',
    sourceAccountNumber: '502008491024',
    destinationAccountNumber: '918273645019',
    beneficiaryName: 'Rajesh Kumar Gupta',
    beneficiaryBank: 'HDFC Bank Ltd',
    beneficiaryIfsc: 'HDFC0000060',
    transferMode: 'RTGS',
    amount: 250000.00,
    currency: 'INR',
    type: 'TRANSFER',
    status: 'COMPLETED',
    description: 'Quarterly office inventory invoice clearance',
    timestamp: '2026-10-13T14:30:11Z',
    valueDate: '2026-10-13',
    category: 'Vendor Settlement',
    fee: 0.00,
    balanceAfter: 492300.00,
    channel: 'RTGS',
  },
  {
    id: 'tx_004',
    transactionReference: 'FINC20261012010000',
    sourceAccountId: 'acc_sav_001',
    sourceAccountNumber: '501004928172',
    destinationAccountNumber: '501004928172',
    beneficiaryName: 'FinCore Interest Credit',
    beneficiaryBank: 'FinCore Bank',
    beneficiaryIfsc: 'FINC0001004',
    transferMode: 'INTERNAL',
    amount: 1845.50,
    currency: 'INR',
    type: 'DEPOSIT',
    status: 'COMPLETED',
    description: 'Quarterly Savings Interest Credit (3.5% p.a.)',
    timestamp: '2026-10-12T01:00:00Z',
    valueDate: '2026-10-12',
    category: 'Interest',
    fee: 0.00,
    balanceAfter: 88866.00,
    channel: 'NET_BANKING',
  },
  {
    id: 'tx_005',
    transactionReference: 'FINC20261010182045',
    sourceAccountId: 'acc_sav_001',
    sourceAccountNumber: '501004928172',
    destinationAccountNumber: '100293847561',
    beneficiaryName: 'Tata Power Delhi Distribution Ltd',
    beneficiaryBank: 'ICICI Bank Ltd',
    beneficiaryIfsc: 'ICIC0000007',
    transferMode: 'NEFT',
    amount: 4320.00,
    currency: 'INR',
    type: 'BILL_PAYMENT',
    status: 'COMPLETED',
    description: 'Electricity Bill Payment for Consumer #882190',
    timestamp: '2026-10-10T18:20:45Z',
    valueDate: '2026-10-10',
    category: 'Utilities',
    fee: 0.00,
    balanceAfter: 87020.50,
    channel: 'NET_BANKING',
  },
];

/**
 * Format currency in Indian numbering system (e.g. ₹1,84,520.50)
 */
export function formatINR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date in Indian readable format (e.g. 15 Oct 2026 or 15/10/2026)
 */
export function formatIndianDate(dateStr: string, withTime = false): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    if (!withTime) {
      return `${day} ${month} ${year}`;
    }
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${mins} IST`;
  } catch {
    return dateStr;
  }
}

/**
 * Mask account number in Indian netbanking format (e.g. XXXXXXXX8172)
 */
export function maskAccountNumber(accNum: string): string {
  if (!accNum) return '—';
  if (accNum.length <= 4) return accNum;
  const lastFour = accNum.slice(-4);
  return 'XXXX-XXXX-' + lastFour;
}

export function generateDemoStatement(account: Account, startDate: string, endDate: string): AccountStatement {
  const accountTxs = DEMO_TRANSACTIONS.filter(
    (t) => t.sourceAccountId === account.id || t.sourceAccountNumber === account.accountNumber
  );

  const totalCredits = accountTxs
    .filter((t) => t.type === 'DEPOSIT' && t.status === 'COMPLETED')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalDebits = accountTxs
    .filter((t) => (t.type === 'TRANSFER' || t.type === 'WITHDRAWAL' || t.type === 'BILL_PAYMENT') && t.status === 'COMPLETED')
    .reduce((acc, t) => acc + t.amount + t.fee, 0);

  const netCashflow = totalCredits - totalDebits;
  const openingBalance = account.balance - netCashflow;

  return {
    account,
    startDate,
    endDate,
    openingBalance: Math.max(0, openingBalance),
    closingBalance: account.balance,
    totalCredits,
    totalDebits,
    netCashflow,
    generatedAt: new Date().toISOString(),
    transactions: accountTxs,
  };
}
