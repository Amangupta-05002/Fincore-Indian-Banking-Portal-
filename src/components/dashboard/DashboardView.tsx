import React, { useState } from 'react';
import { useBanking } from '../../context/BankingContext';
import { useAuth } from '../../context/AuthContext';
import { Transaction } from '../../types';
import { formatINR, formatIndianDate, maskAccountNumber } from '../../services/demoDataProvider';
import {
  Eye,
  EyeOff,
  Send,
  History,
  FileText,
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface Props {
  onNavigate: (tab: string) => void;
  onOpenQuickTransfer: () => void;
  onSelectTransaction: (tx: Transaction) => void;
}

export const DashboardView: React.FC<Props> = ({
  onNavigate,
  onOpenQuickTransfer,
  onSelectTransaction,
}) => {
  const { user } = useAuth();
  const { accounts, transactions, setSelectedAccountId } = useBanking();
  const [hideBalances, setHideBalances] = useState(false);

  // Calculate total balance in INR
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  // Five most recent transactions
  const recentTransactions = transactions.slice(0, 5);

  const handleViewBalanceClick = () => {
    setHideBalances(false);
    // Smooth scroll down to accounts section if needed
    const el = document.getElementById('accounts-summary-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* 1. Customer Welcome & Branch Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">
            Internet Banking Portal
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
            Welcome, {user?.fullName || 'Customer'}
          </h1>
          <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>CIF Number: <strong className="font-mono text-slate-800">{user?.cifNumber || 'CIF88390192'}</strong></span>
            <span>·</span>
            <span>Primary Branch: <strong className="text-slate-800">Connaught Place, New Delhi</strong></span>
            <span>·</span>
            <span>IFSC: <strong className="font-mono text-slate-800">FINC0001004</strong></span>
          </div>
        </div>

        <div className="text-left sm:text-right shrink-0">
          <div className="text-xs text-slate-500">Last Successful Login</div>
          <div className="text-xs font-medium text-slate-800">
            {formatIndianDate(new Date().toISOString(), true)}
          </div>
        </div>
      </div>

      {/* 2. Total Balance & Four Primary Actions */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Account Balance
              </span>
              <button
                onClick={() => setHideBalances(!hideBalances)}
                className="text-slate-400 hover:text-slate-600 p-0.5"
                title={hideBalances ? 'Show balance' : 'Hide balance'}
              >
                {hideBalances ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[#092244] mt-1 tabular-nums">
              {hideBalances ? '₹ ••••••••' : formatINR(totalBalance)}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cumulative balance across {accounts.length} active account(s)
            </p>
          </div>

          {/* Four Primary Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto">
            {/* Action 1: View Balance */}
            <button
              onClick={handleViewBalanceClick}
              className="px-3.5 py-2.5 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-medium text-xs flex flex-col items-center justify-center text-center gap-1 transition-colors"
            >
              <Eye className="w-4 h-4 text-[#092244]" />
              <span>View Balance</span>
            </button>

            {/* Action 2: Transfer Money */}
            <button
              onClick={onOpenQuickTransfer}
              className="px-3.5 py-2.5 rounded bg-blue-900 hover:bg-blue-850 text-white font-medium text-xs flex flex-col items-center justify-center text-center gap-1 transition-colors shadow-sm"
            >
              <Send className="w-4 h-4 text-amber-300" />
              <span>Transfer Money</span>
            </button>

            {/* Action 3: Transaction History */}
            <button
              onClick={() => onNavigate('transactions')}
              className="px-3.5 py-2.5 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-medium text-xs flex flex-col items-center justify-center text-center gap-1 transition-colors"
            >
              <History className="w-4 h-4 text-[#092244]" />
              <span>Transaction History</span>
            </button>

            {/* Action 4: Download Statement */}
            <button
              onClick={() => onNavigate('statements')}
              className="px-3.5 py-2.5 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-medium text-xs flex flex-col items-center justify-center text-center gap-1 transition-colors"
            >
              <FileText className="w-4 h-4 text-[#092244]" />
              <span>Download Statement</span>
            </button>
          </div>
        </div>

        {/* Security & Customer Care Notice */}
        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
          <span>Security Tip: Never share your NetBanking password, OTP, or UPI PIN with anyone over call or SMS.</span>
          <span className="font-mono text-slate-600">Customer Helpline: 1800-11-2211 (Toll Free)</span>
        </div>
      </div>

      {/* 3. Individual Account Summaries */}
      <div id="accounts-summary-section" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            My Account Summaries
          </h2>
          <button
            onClick={() => onNavigate('accounts')}
            className="text-xs text-blue-900 hover:text-blue-700 font-semibold flex items-center gap-1"
          >
            <span>Manage All Accounts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider">
                      {acc.accountType === 'SAVINGS'
                        ? 'Savings Account'
                        : acc.accountType === 'CURRENT'
                        ? 'Current Account'
                        : acc.accountType === 'FIXED_DEPOSIT'
                        ? 'Fixed Deposit'
                        : `${acc.accountType} Account`}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                      {acc.nickname || acc.accountType}
                    </h3>
                  </div>

                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase font-mono">
                    {acc.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>A/c Number:</span>
                    <span className="font-mono font-medium text-slate-900">
                      {hideBalances ? '••••••••' : maskAccountNumber(acc.accountNumber)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span>IFSC Code:</span>
                    <span className="font-mono text-slate-800">{acc.ifscCode || 'FINC0001004'}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span>Branch:</span>
                    <span className="text-slate-800 truncate max-w-[150px]" title={acc.branchName || 'Connaught Place'}>
                      {acc.branchName || 'Connaught Place'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Available Balance</span>
                  <div className="text-xl font-bold font-mono text-[#092244] tabular-nums mt-0.5">
                    {hideBalances ? '₹ ••••••••' : formatINR(acc.availableBalance)}
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSelectedAccountId(acc.id);
                    onOpenQuickTransfer();
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-blue-900 hover:text-blue-750 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                >
                  Transfer Money
                </button>
                <button
                  onClick={() => {
                    setSelectedAccountId(acc.id);
                    onNavigate('statements');
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                >
                  Statement
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Five Most Recent Transactions */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recent Transactions (Last 5 Entries)
            </h2>
            <p className="text-xs text-slate-500">Account debits and credits recorded on your ledger</p>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs text-blue-900 hover:text-blue-750 font-semibold flex items-center gap-1"
          >
            <span>View Full Statement</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No recent transactions recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider bg-slate-50 font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Description / Narration</th>
                  <th className="py-3 px-4">Mode / Ref No.</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Debit / Credit (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.map((tx) => {
                  const isCredit = tx.type === 'DEPOSIT';
                  return (
                    <tr
                      key={tx.id}
                      onClick={() => onSelectTransaction(tx)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {formatIndianDate(tx.timestamp)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{tx.description}</div>
                        <div className="text-[11px] text-slate-500">
                          {tx.beneficiaryName}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        <span className="font-semibold text-slate-800">{tx.channel || tx.transferMode || 'IMPS'}</span> · {tx.transactionReference}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                            tx.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : tx.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-bold tabular-nums whitespace-nowrap text-sm ${
                          isCredit ? 'text-emerald-700' : 'text-slate-900'
                        }`}
                      >
                        {isCredit ? '+' : '-'}{formatINR(tx.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
