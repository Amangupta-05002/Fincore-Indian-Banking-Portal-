import {
  Account,
  AccountType,
  AccountStatement,
  Beneficiary,
  Transaction,
  TransferRequest,
  TransferResponse,
  TransferMode,
} from '../types';
import { apiRequest } from './apiClient';
import {
  DEMO_ACCOUNTS,
  DEMO_BENEFICIARIES,
  DEMO_TRANSACTIONS,
  generateDemoStatement,
} from './demoDataProvider';

export interface CreateAccountDTO {
  accountType: AccountType;
  currency?: string;
  initialDeposit: number;
  nickname?: string;
}

export interface TransactionFilterParams {
  accountId?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  size?: number;
}

// Memory cache for demo mode updates
let inMemoryDemoAccounts: Account[] = [...DEMO_ACCOUNTS];
let inMemoryDemoTransactions: Transaction[] = [...DEMO_TRANSACTIONS];
let inMemoryDemoBeneficiaries: Beneficiary[] = [...DEMO_BENEFICIARIES];

export const bankingService = {
  async getAccounts(isDemoMode: boolean): Promise<Account[]> {
    if (isDemoMode) {
      return inMemoryDemoAccounts;
    }
    const response = await apiRequest<Account[]>('/accounts');
    return Array.isArray(response) ? response : [];
  },

  async getAccountById(id: string, isDemoMode: boolean): Promise<Account> {
    if (isDemoMode) {
      const acc = inMemoryDemoAccounts.find((a) => a.id === id);
      if (!acc) throw new Error('Account not found in demo records');
      return acc;
    }
    return apiRequest<Account>(`/accounts/${id}`);
  },

  async createAccount(payload: CreateAccountDTO, isDemoMode: boolean): Promise<Account> {
    if (isDemoMode) {
      const randomAccNum = '50' + Math.floor(1000000000 + Math.random() * 9000000000);
      const newAcc: Account = {
        id: 'acc_' + Math.random().toString(36).substring(2, 8),
        accountNumber: randomAccNum,
        accountType: payload.accountType,
        currency: 'INR',
        balance: payload.initialDeposit || 0,
        availableBalance: payload.initialDeposit || 0,
        status: 'ACTIVE',
        ifscCode: 'FINC0001004',
        micrCode: '110992004',
        branchName: 'Connaught Place Branch, New Delhi',
        routingNumber: 'FINC0001004',
        interestRate: payload.accountType === 'SAVINGS' ? 3.50 : payload.accountType === 'FIXED_DEPOSIT' ? 7.10 : 0.00,
        overdraftLimit: payload.accountType === 'CURRENT' ? 50000 : 0,
        nickname: payload.nickname || `${payload.accountType} Account`,
        nomineeRegistered: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      inMemoryDemoAccounts = [newAcc, ...inMemoryDemoAccounts];
      return newAcc;
    }

    return apiRequest<Account>('/accounts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async toggleAccountFreeze(id: string, freeze: boolean, isDemoMode: boolean): Promise<Account> {
    if (isDemoMode) {
      inMemoryDemoAccounts = inMemoryDemoAccounts.map((a) =>
        a.id === id ? { ...a, status: freeze ? 'FROZEN' : 'ACTIVE' } : a
      );
      const acc = inMemoryDemoAccounts.find((a) => a.id === id);
      return acc!;
    }

    return apiRequest<Account>(`/accounts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: freeze ? 'FROZEN' : 'ACTIVE' }),
    });
  },

  async getTransactions(
    params: TransactionFilterParams = {},
    isDemoMode: boolean
  ): Promise<Transaction[]> {
    if (isDemoMode) {
      let filtered = [...inMemoryDemoTransactions];
      if (params.accountId && params.accountId !== 'ALL') {
        filtered = filtered.filter(
          (t) => t.sourceAccountId === params.accountId || t.sourceAccountNumber === params.accountId
        );
      }
      if (params.type && params.type !== 'ALL') {
        filtered = filtered.filter((t) => t.type === params.type);
      }
      if (params.status && params.status !== 'ALL') {
        filtered = filtered.filter((t) => t.status === params.status);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.description.toLowerCase().includes(q) ||
            t.transactionReference.toLowerCase().includes(q) ||
            t.beneficiaryName.toLowerCase().includes(q) ||
            t.destinationAccountNumber.includes(q)
        );
      }
      return filtered;
    }

    const query = new URLSearchParams();
    if (params.accountId && params.accountId !== 'ALL') query.set('accountId', params.accountId);
    if (params.type && params.type !== 'ALL') query.set('type', params.type);
    if (params.status && params.status !== 'ALL') query.set('status', params.status);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.search) query.set('search', params.search);
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.size !== undefined) query.set('size', String(params.size));

    const response = await apiRequest<Transaction[] | { content: Transaction[] }>(
      `/transactions?${query.toString()}`
    );

    if (Array.isArray(response)) {
      return response;
    }
    if (response && 'content' in response && Array.isArray(response.content)) {
      return response.content;
    }
    return [];
  },

  async executeTransfer(
    payload: TransferRequest,
    isDemoMode: boolean
  ): Promise<TransferResponse> {
    if (isDemoMode) {
      const sourceAcc = inMemoryDemoAccounts.find((a) => a.id === payload.sourceAccountId);
      if (!sourceAcc) {
        throw new Error('Debiting account not found');
      }
      if (sourceAcc.status === 'FROZEN') {
        throw new Error('Debiting account is currently frozen/locked and cannot initiate transfers.');
      }
      if (sourceAcc.availableBalance < payload.amount) {
        throw new Error(
          `Insufficient balance. Available: ₹${sourceAcc.availableBalance.toLocaleString('en-IN')}, Requested: ₹${payload.amount.toLocaleString('en-IN')}`
        );
      }

      // Indian Banking validation rules
      if (payload.transferMode === 'RTGS' && payload.amount < 200000) {
        throw new Error('RTGS requires a minimum transfer amount of ₹2,00,000. For lower amounts, please select IMPS or NEFT.');
      }
      if (payload.transferMode === 'IMPS' && payload.amount > 500000) {
        throw new Error('IMPS per-transaction limit is ₹5,00,000. For transfers above ₹5,00,000, please use NEFT or RTGS.');
      }

      // Deduct balance in demo store
      const newBalance = sourceAcc.balance - payload.amount;
      const newAvailable = sourceAcc.availableBalance - payload.amount;
      inMemoryDemoAccounts = inMemoryDemoAccounts.map((a) =>
        a.id === sourceAcc.id
          ? { ...a, balance: newBalance, availableBalance: newAvailable }
          : a
      );

      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const refPrefix = payload.transferMode === 'IMPS' ? 'IMPS' : payload.transferMode === 'NEFT' ? 'NEFT' : 'RTGS';
      const txRef = `${refPrefix}${todayStr}${Math.floor(100000 + Math.random() * 900000)}`;

      const newTx: Transaction = {
        id: 'tx_' + Math.random().toString(36).substring(2, 9),
        transactionReference: txRef,
        sourceAccountId: sourceAcc.id,
        sourceAccountNumber: sourceAcc.accountNumber,
        sourceAccountType: sourceAcc.accountType,
        destinationAccountNumber: payload.destinationAccountNumber,
        beneficiaryName: payload.beneficiaryName,
        beneficiaryBank: payload.beneficiaryBankCode || 'Beneficiary Bank',
        beneficiaryIfsc: payload.beneficiaryIfsc,
        transferMode: payload.transferMode,
        amount: payload.amount,
        currency: 'INR',
        type: 'TRANSFER',
        status: 'COMPLETED',
        description: payload.description || `${payload.transferMode} Fund Transfer`,
        timestamp: new Date().toISOString(),
        valueDate: new Date().toISOString().slice(0, 10),
        fee: 0.0,
        balanceAfter: newBalance,
        channel: payload.transferMode as any,
      };

      inMemoryDemoTransactions = [newTx, ...inMemoryDemoTransactions];

      return {
        transactionReference: txRef,
        status: 'COMPLETED',
        message: `${payload.transferMode} transfer processed successfully. UTR / Ref: ${txRef}`,
        timestamp: newTx.timestamp,
        amount: payload.amount,
        currency: 'INR',
        fee: 0.0,
        transferMode: payload.transferMode,
        sourceAccountNumber: sourceAcc.accountNumber,
        destinationAccountNumber: payload.destinationAccountNumber,
        beneficiaryName: payload.beneficiaryName,
        beneficiaryIfsc: payload.beneficiaryIfsc,
        sourceAvailableBalance: newAvailable,
      };
    }

    // REAL authoritative Spring Boot call
    return apiRequest<TransferResponse>('/transfers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getStatement(
    accountId: string,
    startDate: string,
    endDate: string,
    isDemoMode: boolean
  ): Promise<AccountStatement> {
    if (isDemoMode) {
      const account = inMemoryDemoAccounts.find((a) => a.id === accountId);
      if (!account) {
        throw new Error('Account not found');
      }
      return generateDemoStatement(account, startDate, endDate);
    }

    const query = new URLSearchParams({ startDate, endDate });
    return apiRequest<AccountStatement>(`/accounts/${accountId}/statement?${query.toString()}`);
  },

  async getBeneficiaries(isDemoMode: boolean): Promise<Beneficiary[]> {
    if (isDemoMode) {
      return inMemoryDemoBeneficiaries;
    }
    const response = await apiRequest<Beneficiary[]>('/beneficiaries');
    return Array.isArray(response) ? response : [];
  },

  async createBeneficiary(
    beneficiary: Omit<Beneficiary, 'id'>,
    isDemoMode: boolean
  ): Promise<Beneficiary> {
    if (isDemoMode) {
      const newBen: Beneficiary = {
        ...beneficiary,
        id: 'ben_' + Math.random().toString(36).substring(2, 8),
        status: 'ACTIVE',
        addedAt: new Date().toISOString().slice(0, 10),
      };
      inMemoryDemoBeneficiaries = [newBen, ...inMemoryDemoBeneficiaries];
      return newBen;
    }

    return apiRequest<Beneficiary>('/beneficiaries', {
      method: 'POST',
      body: JSON.stringify(beneficiary),
    });
  },

  async deleteBeneficiary(id: string, isDemoMode: boolean): Promise<void> {
    if (isDemoMode) {
      inMemoryDemoBeneficiaries = inMemoryDemoBeneficiaries.filter((b) => b.id !== id);
      return;
    }
    await apiRequest(`/beneficiaries/${id}`, { method: 'DELETE' });
  },

  resetDemoData(): void {
    inMemoryDemoAccounts = [...DEMO_ACCOUNTS];
    inMemoryDemoTransactions = [...DEMO_TRANSACTIONS];
    inMemoryDemoBeneficiaries = [...DEMO_BENEFICIARIES];
  },
};
