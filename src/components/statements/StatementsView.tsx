import React, { useState, useEffect } from 'react';
import { useBanking } from '../../context/BankingContext';
import { AccountStatement } from '../../types';
import { bankingService } from '../../services/bankingService';
import { formatINR, formatIndianDate, maskAccountNumber } from '../../services/demoDataProvider';
import {
  FileText,
  Printer,
  Download,
  Building2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface Props {
  initialAccountId?: string;
}

export const StatementsView: React.FC<Props> = ({ initialAccountId }) => {
  const { accounts, selectedAccount, isDemoMode } = useBanking();
  const [targetAccountId, setTargetAccountId] = useState(initialAccountId || selectedAccount?.id || '');
  const [periodPreset, setPeriodPreset] = useState<'30D' | '90D' | 'FY'>('30D');
  const [statement, setStatement] = useState<AccountStatement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!targetAccountId && accounts.length > 0) {
      setTargetAccountId(accounts[0].id);
    }
  }, [accounts, targetAccountId]);

  useEffect(() => {
    if (initialAccountId) {
      setTargetAccountId(initialAccountId);
    }
  }, [initialAccountId]);

  const fetchStatement = async () => {
    if (!targetAccountId) return;
    setIsLoading(true);
    setError(null);

    const now = new Date();
    let startDate = new Date();

    if (periodPreset === '30D') {
      startDate.setDate(now.getDate() - 30);
    } else if (periodPreset === '90D') {
      startDate.setDate(now.getDate() - 90);
    } else {
      // Indian Financial Year begins 1st April
      startDate = new Date(now.getFullYear(), 3, 1);
      if (startDate > now) {
        startDate = new Date(now.getFullYear() - 1, 3, 1);
      }
    }

    try {
      const data = await bankingService.getStatement(
        targetAccountId,
        startDate.toISOString().slice(0, 10),
        now.toISOString().slice(0, 10),
        isDemoMode
      );
      setStatement(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate account statement';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement();
  }, [targetAccountId, periodPreset, isDemoMode]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!statement || statement.transactions.length === 0) return;
    const headers = ['Value Date', 'UTR / Ref No', 'Narration', 'Mode', 'Debit (INR)', 'Credit (INR)'];
    const rows = statement.transactions.map((t) => [
      t.timestamp.slice(0, 10),
      t.transactionReference,
      `"${t.description.replace(/"/g, '""')}"`,
      t.transferMode || t.channel || 'IMPS',
      t.type !== 'DEPOSIT' ? t.amount : '',
      t.type === 'DEPOSIT' ? t.amount : '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fincore_statement_${statement.account.accountNumber}_${statement.endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls (Hidden during print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Account Statement
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Official periodic ledger statement with opening, closing, and clear balances
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={!statement}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded font-medium transition-colors disabled:opacity-50 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
          <button
            onClick={handlePrint}
            disabled={!statement}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-850 rounded transition-colors disabled:opacity-50 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-amber-300" />
            <span>Print Official Statement</span>
          </button>
        </div>
      </div>

      {/* Control Strip (No Print) */}
      <div className="no-print bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider shrink-0">
            Select Account:
          </label>
          <select
            value={targetAccountId}
            onChange={(e) => setTargetAccountId(e.target.value)}
            aria-label="Select Account"
            className="w-full sm:w-64 px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-700 bg-white"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.nickname || acc.accountType} (••{acc.accountNumber.slice(-4)})
              </option>
            ))}
          </select>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded text-xs self-stretch sm:self-auto justify-center">
          {[
            { id: '30D', label: 'Last 30 Days' },
            { id: '90D', label: 'Last 90 Days' },
            { id: 'FY', label: 'Current Financial Year' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriodPreset(tab.id as typeof periodPreset)}
              className={`px-3 py-1 rounded transition-colors ${
                periodPreset === tab.id
                  ? 'bg-blue-900 text-white font-medium shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Printable Bank Statement Canvas */}
      {statement ? (
        <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm print:border-none print:shadow-none">
          {/* Institutional Header */}
          <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/60 print:bg-transparent">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-blue-900 text-amber-400 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                      FinCore Indian Banking
                    </h2>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Internet Banking Account Statement
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right font-mono text-xs text-slate-600 space-y-0.5">
                <div>Period: <strong className="text-slate-900">{formatIndianDate(statement.startDate)} to {formatIndianDate(statement.endDate)}</strong></div>
                <div>Generated on: {formatIndianDate(statement.generatedAt, true)}</div>
                <div>IFSC Code: <strong className="text-blue-900 font-bold">{statement.account.ifscCode || 'FINC0001004'}</strong></div>
              </div>
            </div>

            {/* Account Details & Balances */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Account Holder Details
                </span>
                <div className="font-bold text-slate-900 text-sm">
                  {statement.account.nickname || `${statement.account.accountType} Account`}
                </div>
                <div className="font-mono text-slate-700 mt-0.5">
                  Account Number: {statement.account.accountNumber}
                </div>
                <div className="text-slate-600">
                  Branch: {statement.account.branchName || 'Connaught Place Branch, New Delhi'}
                </div>
                <div className="font-mono text-slate-600">
                  MICR: {statement.account.micrCode || '110992004'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-right">
                <div className="p-2.5 bg-white rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block">Opening Balance</span>
                  <span className="text-sm font-bold font-mono text-slate-800 tabular-nums">
                    {formatINR(statement.openingBalance)}
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block">Closing Balance</span>
                  <span className="text-sm font-bold font-mono text-blue-950 tabular-nums">
                    {formatINR(statement.closingBalance)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cashflow Metrics Summary Strip */}
          <div className="grid grid-cols-3 divide-x divide-slate-200 border-b border-slate-200 bg-slate-50 py-3 text-center text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-medium">Total Credits (+)</span>
              <div className="font-mono font-bold text-emerald-800 text-sm mt-0.5 tabular-nums">
                +{formatINR(statement.totalCredits)}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-medium">Total Debits (-)</span>
              <div className="font-mono font-bold text-slate-800 text-sm mt-0.5 tabular-nums">
                -{formatINR(statement.totalDebits)}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-medium">Net Period Flow</span>
              <div
                className={`font-mono font-bold text-sm mt-0.5 tabular-nums ${
                  statement.netCashflow >= 0 ? 'text-emerald-800' : 'text-rose-800'
                }`}
              >
                {statement.netCashflow >= 0 ? '+' : ''}{formatINR(statement.netCashflow)}
              </div>
            </div>
          </div>

          {/* Itemized Transactions Table */}
          <div className="p-6 sm:p-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Itemized Statement Entries
            </h3>

            {statement.transactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No transactions recorded during this statement period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-300 text-slate-600 text-[10px] uppercase font-bold bg-slate-50">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">UTR / Ref No</th>
                      <th className="py-2.5 px-3">Narration / Description</th>
                      <th className="py-2.5 px-3">Channel</th>
                      <th className="py-2.5 px-3 text-right">Debit (-)</th>
                      <th className="py-2.5 px-3 text-right">Credit (+)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {statement.transactions.map((t) => {
                      const isCredit = t.type === 'DEPOSIT';
                      return (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                            {formatIndianDate(t.timestamp)}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                            {t.transactionReference}
                          </td>
                          <td className="py-2.5 px-3 text-slate-800 max-w-xs">
                            <div className="font-semibold">{t.description}</div>
                            <div className="text-[11px] text-slate-500">{t.beneficiaryName}</div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700 font-semibold text-[11px]">
                            {t.transferMode || t.channel || 'IMPS'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-900">
                            {!isCredit ? formatINR(t.amount) : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-emerald-800">
                            {isCredit ? `+${formatINR(t.amount)}` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Statement Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Computer Generated Electronic Statement · No Physical Signature Required</span>
            </div>
            <div className="font-mono text-slate-600">
              FinCore Indian Banking · Page 1 of 1
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-lg">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-900 mb-2" />
          <span>Generating account statement...</span>
        </div>
      )}
    </div>
  );
};
