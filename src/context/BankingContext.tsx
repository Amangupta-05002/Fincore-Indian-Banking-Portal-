import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  Account,
  BackendHealth,
  Beneficiary,
  Transaction,
  TransferRequest,
  TransferResponse,
} from '../types';
import {
  getApiBaseUrl,
  probeBackendHealth,
  setCustomApiBaseUrl,
} from '../services/apiClient';
import {
  bankingService,
  CreateAccountDTO,
  TransactionFilterParams,
} from '../services/bankingService';

interface BankingContextType {
  accounts: Account[];
  selectedAccount: Account | null;
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string) => void;
  transactions: Transaction[];
  beneficiaries: Beneficiary[];
  backendHealth: BackendHealth;
  isDemoMode: boolean;
  setDemoMode: (val: boolean) => void;
  toggleDemoMode: () => void;
  apiBaseUrl: string;
  updateApiBaseUrl: (newUrl: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  refreshAll: () => Promise<void>;
  filterTransactions: (filters: TransactionFilterParams) => Promise<void>;
  openNewAccount: (dto: CreateAccountDTO) => Promise<Account>;
  toggleFreezeAccount: (accountId: string, freeze: boolean) => Promise<void>;
  executeTransfer: (request: TransferRequest) => Promise<TransferResponse>;
  checkHealth: () => Promise<BackendHealth>;
  addBeneficiary: (ben: Omit<Beneficiary, 'id'>) => Promise<Beneficiary>;
  removeBeneficiary: (id: string) => Promise<void>;
}

const BankingContext = createContext<BankingContextType | undefined>(undefined);

export const BankingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [apiBaseUrl, setApiBaseUrlState] = useState<string>(getApiBaseUrl());
  
  // Default to true for instant visual evaluation, can be toggled to test live Spring Boot
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('fincore_demo_mode');
    return saved !== null ? saved === 'true' : true;
  });

  const [backendHealth, setBackendHealth] = useState<BackendHealth>({
    connected: false,
    url: getApiBaseUrl(),
    checkedAt: new Date().toISOString(),
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async (urlOverride?: string): Promise<BackendHealth> => {
    const health = await probeBackendHealth(urlOverride || apiBaseUrl);
    setBackendHealth(health);
    return health;
  }, [apiBaseUrl]);

  // Initial health probe and data fetch
  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Health check
      const health = await checkHealth();

      // If user is not strictly in forced demo mode and backend is connected, use Live Mode
      let effectiveDemo = isDemoMode;
      if (!health.connected && !isDemoMode) {
        // Automatically switch to demo mode if backend is unreachable, with notice
        effectiveDemo = true;
        setIsDemoMode(true);
        localStorage.setItem('fincore_demo_mode', 'true');
      }

      // 2. Fetch Accounts
      const accList = await bankingService.getAccounts(effectiveDemo);
      setAccounts(accList);
      if (accList.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accList[0].id);
      }

      // 3. Fetch Transactions
      const txList = await bankingService.getTransactions({}, effectiveDemo);
      setTransactions(txList);

      // 4. Fetch Beneficiaries
      const benList = await bankingService.getBeneficiaries(effectiveDemo);
      setBeneficiaries(benList);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve banking data';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [checkHealth, isDemoMode, selectedAccountId]);

  useEffect(() => {
    refreshAll();
  }, [isDemoMode]);

  const setDemoMode = (val: boolean) => {
    setIsDemoMode(val);
    localStorage.setItem('fincore_demo_mode', String(val));
  };

  const toggleDemoMode = () => {
    setDemoMode(!isDemoMode);
  };

  const updateApiBaseUrl = async (newUrl: string) => {
    setCustomApiBaseUrl(newUrl);
    setApiBaseUrlState(newUrl);
    const health = await checkHealth(newUrl);
    if (health.connected) {
      setDemoMode(false);
    }
    await refreshAll();
  };

  const filterTransactions = async (filters: TransactionFilterParams) => {
    setIsLoading(true);
    try {
      const filtered = await bankingService.getTransactions(filters, isDemoMode);
      setTransactions(filtered);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error filtering transactions';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const openNewAccount = async (dto: CreateAccountDTO): Promise<Account> => {
    setIsLoading(true);
    setError(null);
    try {
      const newAcc = await bankingService.createAccount(dto, isDemoMode);
      setAccounts((prev) => [newAcc, ...prev]);
      setSelectedAccountId(newAcc.id);
      return newAcc;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to open new account';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFreezeAccount = async (accountId: string, freeze: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await bankingService.toggleAccountFreeze(accountId, freeze, isDemoMode);
      setAccounts((prev) => prev.map((a) => (a.id === accountId ? updated : a)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update account status';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const executeTransfer = async (request: TransferRequest): Promise<TransferResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await bankingService.executeTransfer(request, isDemoMode);
      // Refresh accounts and transactions to reflect balance deduction
      const updatedAccs = await bankingService.getAccounts(isDemoMode);
      setAccounts(updatedAccs);
      const updatedTxs = await bankingService.getTransactions({}, isDemoMode);
      setTransactions(updatedTxs);
      return response;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transfer execution failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const addBeneficiary = async (ben: Omit<Beneficiary, 'id'>): Promise<Beneficiary> => {
    try {
      const created = await bankingService.createBeneficiary(ben, isDemoMode);
      setBeneficiaries((prev) => [created, ...prev]);
      return created;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add beneficiary';
      setError(msg);
      throw err;
    }
  };

  const removeBeneficiary = async (id: string): Promise<void> => {
    try {
      await bankingService.deleteBeneficiary(id, isDemoMode);
      setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove beneficiary';
      setError(msg);
      throw err;
    }
  };

  const selectedAccount =
    accounts.find((a) => a.id === selectedAccountId) || accounts[0] || null;

  return (
    <BankingContext.Provider
      value={{
        accounts,
        selectedAccount,
        selectedAccountId,
        setSelectedAccountId,
        transactions,
        beneficiaries,
        backendHealth,
        isDemoMode,
        setDemoMode,
        toggleDemoMode,
        apiBaseUrl,
        updateApiBaseUrl,
        isLoading,
        error,
        clearError: () => setError(null),
        refreshAll,
        filterTransactions,
        openNewAccount,
        toggleFreezeAccount,
        executeTransfer,
        checkHealth,
        addBeneficiary,
        removeBeneficiary,
      }}
    >
      {children}
    </BankingContext.Provider>
  );
};

export function useBanking() {
  const context = useContext(BankingContext);
  if (!context) {
    throw new Error('useBanking must be used within a BankingProvider');
  }
  return context;
}
