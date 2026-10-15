/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BankingProvider, useBanking } from './context/BankingContext';
import { BackendStatusBanner } from './components/common/BackendStatusBanner';
import { Header } from './components/common/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { AccountsView } from './components/accounts/AccountsView';
import { TransfersView } from './components/transfers/TransfersView';
import { BeneficiariesView } from './components/beneficiaries/BeneficiariesView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { StatementsView } from './components/statements/StatementsView';
import { JavaBackendHubModal } from './components/modals/JavaBackendHubModal';
import { AuthView } from './components/auth/AuthView';
import { Beneficiary, Transaction } from './types';
import { formatINR } from './services/demoDataProvider';
import {
  Server,
  Building2,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Phone,
} from 'lucide-react';

function FinCoreApp() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const {
    error: bankingError,
    clearError,
    refreshAll,
    setSelectedAccountId,
  } = useBanking();

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isBackendHubOpen, setIsBackendHubOpen] = useState<boolean>(false);
  const [selectedTxDetail, setSelectedTxDetail] = useState<Transaction | null>(null);
  const [statementAccountId, setStatementAccountId] = useState<string | undefined>(undefined);
  const [preselectedBeneficiary, setPreselectedBeneficiary] = useState<Beneficiary | null>(null);

  // Navigate to statement with specific account
  const handleGenerateStatement = (accountId: string) => {
    setStatementAccountId(accountId);
    setSelectedAccountId(accountId);
    setCurrentTab('statements');
  };

  // Navigate to transfer from specific account
  const handleInitiateTransferFrom = (accountId: string) => {
    setSelectedAccountId(accountId);
    setPreselectedBeneficiary(null);
    setCurrentTab('transfer');
  };

  // Navigate to transfer with a preselected beneficiary
  const handleTransferToBeneficiary = (ben: Beneficiary) => {
    setPreselectedBeneficiary(ben);
    setCurrentTab('transfer');
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center text-slate-600 gap-3">
        <RefreshCw className="w-8 h-8 text-[#092244] animate-spin" />
        <span className="text-xs font-mono font-medium">Connecting to FinCore Banking Engine...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col">
      {/* Backend Operational Status Banner */}
      <BackendStatusBanner onOpenBackendHub={() => setIsBackendHubOpen(true)} />

      {/* Main Top Bar */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'transfer') setPreselectedBeneficiary(null);
          setCurrentTab(tab);
        }}
        onOpenBackendHub={() => setIsBackendHubOpen(true)}
        onOpenQuickTransfer={() => {
          setPreselectedBeneficiary(null);
          setCurrentTab('transfer');
        }}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {!isAuthenticated ? (
          <AuthView onOpenBackendHub={() => setIsBackendHubOpen(true)} />
        ) : (
          <div className="space-y-6">
            {/* Global Error Banner if API call failed */}
            {bankingError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-start justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-rose-900">Backend Communication Notice:</span>{' '}
                    <span>{bankingError}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => refreshAll()}
                    className="px-2 py-0.5 text-xs bg-white hover:bg-rose-100 rounded border border-rose-300 transition-colors font-medium text-rose-900"
                  >
                    Retry
                  </button>
                  <button
                    onClick={clearError}
                    className="text-rose-600 hover:text-rose-900 text-xs px-1"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* TAB VIEWS */}
            {currentTab === 'dashboard' && (
              <DashboardView
                onNavigate={(tab) => {
                  if (tab === 'transfer') setPreselectedBeneficiary(null);
                  setCurrentTab(tab);
                }}
                onOpenQuickTransfer={() => {
                  setPreselectedBeneficiary(null);
                  setCurrentTab('transfer');
                }}
                onSelectTransaction={(tx) => setSelectedTxDetail(tx)}
              />
            )}

            {currentTab === 'accounts' && (
              <AccountsView
                onGenerateStatement={handleGenerateStatement}
                onInitiateTransferFromAccount={handleInitiateTransferFrom}
              />
            )}

            {currentTab === 'transfer' && (
              <TransfersView preselectedBeneficiary={preselectedBeneficiary} />
            )}

            {currentTab === 'beneficiaries' && (
              <BeneficiariesView onTransferToBeneficiary={handleTransferToBeneficiary} />
            )}

            {currentTab === 'transactions' && (
              <TransactionsView
                selectedTxModal={selectedTxDetail}
                onCloseTxModal={() => setSelectedTxDetail(null)}
                onOpenTxDetail={(tx) => setSelectedTxDetail(tx)}
              />
            )}

            {currentTab === 'statements' && (
              <StatementsView initialAccountId={statementAccountId} />
            )}
          </div>
        )}
      </main>

      {/* Clean Indian Banking Footer */}
      <footer className="no-print border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="font-bold text-[#092244]">FinCore</span>
              <span>·</span>
              <span className="font-medium">Indian Banking &amp; Transaction Management System</span>
              <span>·</span>
              <span className="font-mono text-[11px] text-slate-500">Java 21 Spring Boot + MySQL</span>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-slate-600">
              <button
                onClick={() => setIsBackendHubOpen(true)}
                className="hover:text-blue-900 transition-colors flex items-center gap-1 font-medium"
              >
                <Server className="w-3 h-3 text-blue-900" />
                <span>Spring Boot REST API Specs</span>
              </button>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>Toll Free: 1800-11-2211</span>
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-2">
            <span>
              Disclaimer: Simulated demonstration internet banking portal. Not connected to real banks, does not initiate real monetary payments, and does not claim RBI approval or live bank integration.
            </span>
            <span className="font-mono shrink-0">
              ISO 27001 Certified Security Practices
            </span>
          </div>
        </div>
      </footer>

      {/* Java Spring Boot & MySQL Hub Modal */}
      <JavaBackendHubModal
        isOpen={isBackendHubOpen}
        onClose={() => setIsBackendHubOpen(false)}
      />

      {/* Global Transaction Detail Modal if opened from Dashboard */}
      {selectedTxDetail && currentTab !== 'transactions' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white border border-slate-300 rounded-lg shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Transaction Detail Record
              </h3>
              <button
                onClick={() => setSelectedTxDetail(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 rounded border border-slate-200 p-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">UTR / Ref:</span>
                <span className="font-mono font-bold text-blue-900">
                  {selectedTxDetail.transactionReference}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Beneficiary:</span>
                <span className="font-semibold text-slate-900">
                  {selectedTxDetail.beneficiaryName}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Amount:</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {formatINR(selectedTxDetail.amount)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Date:</span>
                <span className="font-mono text-slate-700">
                  {new Date(selectedTxDetail.timestamp).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Status:</span>
                <span className="font-mono text-emerald-800 font-semibold">{selectedTxDetail.status}</span>
              </div>
              <div className="py-1">
                <span className="text-slate-500 block mb-0.5">Narration:</span>
                <div className="text-slate-800 bg-white p-2 rounded border border-slate-200 font-mono text-[11px]">
                  {selectedTxDetail.description}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTxDetail(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BankingProvider>
        <FinCoreApp />
      </BankingProvider>
    </AuthProvider>
  );
}
