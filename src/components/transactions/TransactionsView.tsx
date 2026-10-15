import React, { useState, useMemo } from 'react';
import { useBanking } from '../../context/BankingContext';
import { Transaction } from '../../types';
import { formatINR, formatIndianDate, maskAccountNumber } from '../../services/demoDataProvider';
import {
  Search,
  Download,
  FileSpreadsheet,
  FileCode,
  X,
  CreditCard,
  Building,
} from 'lucide-react';

interface Props {
  selectedTxModal?: Transaction | null;
  onCloseTxModal?: () => void;
  onOpenTxDetail: (tx: Transaction) => void;
}

export const TransactionsView: React.FC<Props> = ({
  selectedTxModal,
  onCloseTxModal,
  onOpenTxDetail,
}) => {
  const { transactions, accounts } = useBanking();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [accountFilter, setAccountFilter] = useState<string>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('ALL');

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    if (accountFilter !== 'ALL') {
      result = result.filter(
        (t) => t.sourceAccountId === accountFilter || t.sourceAccountNumber === accountFilter
      );
    }

    if (typeFilter !== 'ALL') {
      result = result.filter((t) => t.type === typeFilter || t.transferMode === typeFilter);
    }

    if (statusFilter !== 'ALL') {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.transactionReference.toLowerCase().includes(q) ||
          t.beneficiaryName.toLowerCase().includes(q) ||
          t.destinationAccountNumber.includes(q) ||
          (t.beneficiaryIfsc && t.beneficiaryIfsc.toLowerCase().includes(q))
      );
    }

    if (dateRangeFilter !== 'ALL') {
      const now = new Date().getTime();
      const days = dateRangeFilter === '7D' ? 7 : dateRangeFilter === '30D' ? 30 : 90;
      const threshold = now - days * 24 * 60 * 60 * 1000;
      result = result.filter((t) => new Date(t.timestamp).getTime() >= threshold);
    }

    return result;
  }, [transactions, accountFilter, typeFilter, statusFilter, searchTerm, dateRangeFilter]);

  // Export handlers
  const exportToCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = [
      'UTR/Reference',
      'Date',
      'Transaction Mode',
      'Status',
      'Beneficiary / Payee',
      'Beneficiary IFSC',
      'Destination Account',
      'Amount (INR)',
      'Description / Narration',
    ];
    const rows = filteredTransactions.map((t) => [
      t.transactionReference,
      t.timestamp.slice(0, 10),
      t.transferMode || t.type,
      t.status,
      `"${t.beneficiaryName.replace(/"/g, '""')}"`,
      t.beneficiaryIfsc || 'N/A',
      t.destinationAccountNumber,
      t.amount,
      `"${t.description.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fincore_statement_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    if (filteredTransactions.length === 0) return;
    const jsonStr = JSON.stringify(filteredTransactions, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fincore_transactions_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Transaction History &amp; Passbook Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Complete record of debits, credits, and inter-bank IMPS, NEFT, and RTGS clearing references
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            disabled={filteredTransactions.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded font-medium transition-colors disabled:opacity-50 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Download CSV</span>
          </button>
          <button
            onClick={exportToJSON}
            disabled={filteredTransactions.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded font-medium transition-colors disabled:opacity-50 shadow-xs"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-700" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search narration, UTR, beneficiary name, IFSC..."
              className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-700"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Account Filter */}
          <div>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              aria-label="Filter by Account"
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-blue-700 bg-white"
            >
              <option value="ALL">All Accounts ({accounts.length})</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.nickname || acc.accountType} (••{acc.accountNumber.slice(-4)})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by Status"
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-blue-700 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        {/* Transfer Method Tabs & Period Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1 text-xs">
            {['ALL', 'IMPS', 'NEFT', 'RTGS', 'DEPOSIT'].map((typeKey) => (
              <button
                key={typeKey}
                onClick={() => setTypeFilter(typeKey)}
                className={`px-3 py-1 rounded transition-colors ${
                  typeFilter === typeKey
                    ? 'bg-blue-900 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                }`}
              >
                {typeKey === 'ALL'
                  ? 'All Transactions'
                  : typeKey === 'DEPOSIT'
                  ? 'Credits / Salary'
                  : typeKey}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 mr-1">Period:</span>
            {['ALL', '7D', '30D', '90D'].map((rangeKey) => (
              <button
                key={rangeKey}
                onClick={() => setDateRangeFilter(rangeKey)}
                className={`px-2 py-0.5 rounded border text-[11px] font-medium transition-colors ${
                  dateRangeFilter === rangeKey
                    ? 'bg-blue-50 border-blue-900 text-blue-900'
                    : 'bg-white border-slate-300 text-slate-600 hover:text-slate-900'
                }`}
              >
                {rangeKey === 'ALL' ? 'All Time' : rangeKey}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-800">No Transactions Found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No ledger entries match the active filters.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('ALL');
                setStatusFilter('ALL');
                setAccountFilter('ALL');
                setDateRangeFilter('ALL');
              }}
              className="px-3 py-1.5 text-xs text-blue-900 font-semibold bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider bg-slate-50 font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">UTR / Ref No.</th>
                  <th className="py-3 px-4">Beneficiary / Source</th>
                  <th className="py-3 px-4">Narration</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => {
                  const isCredit = tx.type === 'DEPOSIT';
                  return (
                    <tr
                      key={tx.id}
                      onClick={() => onOpenTxDetail(tx)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {formatIndianDate(tx.timestamp)}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">
                        {tx.transactionReference}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{tx.beneficiaryName}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {maskAccountNumber(tx.destinationAccountNumber)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {tx.description}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 font-semibold text-[11px]">
                        {tx.transferMode || tx.channel || 'IMPS'}
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

        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <span>Showing <strong className="text-slate-800">{filteredTransactions.length}</strong> of <strong className="text-slate-800">{transactions.length}</strong> transactions</span>
          <span className="font-mono text-[11px]">Indian Banking Settlement Ledger</span>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white border border-slate-300 rounded-lg shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Transaction Audit Record
              </h3>
              <button
                onClick={onCloseTxModal}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded border border-slate-200 p-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">UTR / Ref Number:</span>
                <span className="font-mono font-bold text-blue-900">
                  {selectedTxModal.transactionReference}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Payee / Beneficiary:</span>
                <span className="font-bold text-slate-900">{selectedTxModal.beneficiaryName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Destination Account:</span>
                <span className="font-mono text-slate-800">
                  {selectedTxModal.destinationAccountNumber}
                </span>
              </div>
              {selectedTxModal.beneficiaryIfsc && (
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Beneficiary IFSC:</span>
                  <span className="font-mono text-blue-900 font-semibold">
                    {selectedTxModal.beneficiaryIfsc}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Amount:</span>
                <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                  {formatINR(selectedTxModal.amount)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Transfer Mode:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {selectedTxModal.transferMode || selectedTxModal.channel || 'IMPS'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Status:</span>
                <span className="font-mono text-emerald-800 font-semibold">{selectedTxModal.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Date &amp; Time:</span>
                <span className="font-mono text-slate-700">
                  {formatIndianDate(selectedTxModal.timestamp, true)}
                </span>
              </div>
              <div className="py-1">
                <span className="text-slate-500 block mb-0.5">Narration / Memo:</span>
                <div className="text-slate-800 bg-white p-2 rounded border border-slate-200 font-mono text-[11px]">
                  {selectedTxModal.description}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={onCloseTxModal}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
