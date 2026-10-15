import React, { useState } from 'react';
import { useBanking } from '../../context/BankingContext';
import { Account, AccountType } from '../../types';
import { formatINR, maskAccountNumber } from '../../services/demoDataProvider';
import {
  PlusCircle,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  Check,
  Building2,
  X,
  Send,
  FileText,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  onGenerateStatement: (accountId: string) => void;
  onInitiateTransferFromAccount: (accountId: string) => void;
}

export const AccountsView: React.FC<Props> = ({
  onGenerateStatement,
  onInitiateTransferFromAccount,
}) => {
  const {
    accounts,
    selectedAccount,
    setSelectedAccountId,
    openNewAccount,
    toggleFreezeAccount,
  } = useBanking();

  const [isOpeningModal, setIsOpeningModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revealedAccountIds, setRevealedAccountIds] = useState<Record<string, boolean>>({});

  // New account form state
  const [newAccType, setNewAccType] = useState<AccountType>('SAVINGS');
  const [newAccNickname, setNewAccNickname] = useState('');
  const [newAccDeposit, setNewAccDeposit] = useState('10000');
  const [newAccBranch, setNewAccBranch] = useState('Connaught Place Branch, New Delhi');
  const [nomineeName, setNomineeName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [freezingAccountId, setFreezingAccountId] = useState<string | null>(null);

  const toggleRevealAccount = (id: string) => {
    setRevealedAccountIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const depositNum = parseFloat(newAccDeposit) || 0;

    if (depositNum < 0) {
      setFormError('Initial deposit cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    try {
      await openNewAccount({
        accountType: newAccType,
        currency: 'INR',
        initialDeposit: depositNum,
        nickname: newAccNickname.trim() || undefined,
      });
      setIsOpeningModal(false);
      setNewAccNickname('');
      setNewAccDeposit('10000');
      setNomineeName('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to open account';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleFreeze = async (acc: Account) => {
    setFreezingAccountId(acc.id);
    try {
      const willFreeze = acc.status !== 'FROZEN';
      await toggleFreezeAccount(acc.id, willFreeze);
    } finally {
      setFreezingAccountId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            My Bank Accounts
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Overview of Savings, Current, and Fixed Deposit accounts with branch details and security controls
          </p>
        </div>

        <button
          onClick={() => setIsOpeningModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-850 rounded transition-colors shadow-sm shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-amber-300" />
          <span>Open New Account</span>
        </button>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map((acc) => {
          const isFrozen = acc.status === 'FROZEN';
          const isRevealed = !!revealedAccountIds[acc.id];
          const isSelected = selectedAccount?.id === acc.id;

          return (
            <div
              key={acc.id}
              className={`bg-white border rounded-lg p-5 flex flex-col justify-between shadow-sm transition-all ${
                isSelected
                  ? 'border-blue-900 ring-1 ring-blue-900'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-4">
                {/* Top header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                      {acc.accountType === 'SAVINGS'
                        ? 'Savings Account'
                        : acc.accountType === 'CURRENT'
                        ? 'Current Account'
                        : acc.accountType === 'FIXED_DEPOSIT'
                        ? 'Fixed Deposit'
                        : `${acc.accountType} A/c`}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                      {acc.nickname || `${acc.accountType} Account`}
                    </h3>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      isFrozen
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {acc.status}
                  </span>
                </div>

                {/* Balances */}
                <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1.5">
                  <span className="text-[11px] text-slate-500 block">Available Balance</span>
                  <div className="text-xl font-bold font-mono text-[#092244] tabular-nums">
                    {formatINR(acc.availableBalance)}
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                    <span>Clear Balance:</span>
                    <span className="font-mono font-medium text-slate-800">{formatINR(acc.balance)}</span>
                  </div>
                </div>

                {/* Indian Banking Details */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500 text-[11px]">Account Number:</span>
                    <div className="flex items-center gap-1.5 font-mono text-slate-900 font-medium">
                      <span>{isRevealed ? acc.accountNumber : maskAccountNumber(acc.accountNumber)}</span>
                      <button
                        onClick={() => toggleRevealAccount(acc.id)}
                        className="text-slate-400 hover:text-slate-600"
                        title={isRevealed ? 'Mask' : 'Unhide'}
                      >
                        {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => handleCopy(acc.accountNumber, `acc_${acc.id}`)}
                        className="text-slate-400 hover:text-slate-600"
                        title="Copy account number"
                      >
                        {copiedKey === `acc_${acc.id}` ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500 text-[11px]">IFSC Code:</span>
                    <span className="font-mono font-bold text-blue-900">{acc.ifscCode || 'FINC0001004'}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500 text-[11px]">MICR Code:</span>
                    <span className="font-mono text-slate-800">{acc.micrCode || '110992004'}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500 text-[11px]">Branch:</span>
                    <span className="text-slate-800 truncate max-w-[160px]" title={acc.branchName || 'Connaught Place'}>
                      {acc.branchName || 'Connaught Place, New Delhi'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500 text-[11px]">Interest Rate:</span>
                    <span className="font-mono text-emerald-800 font-semibold">
                      {acc.interestRate ? `${acc.interestRate}% p.a.` : '0.00%'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-3">
                <button
                  onClick={() => onInitiateTransferFromAccount(acc.id)}
                  disabled={isFrozen}
                  className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-850 rounded disabled:opacity-40 transition-colors"
                >
                  Transfer Money
                </button>

                <button
                  onClick={() => onGenerateStatement(acc.id)}
                  className="px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                >
                  Statement
                </button>

                <button
                  onClick={() => handleToggleFreeze(acc)}
                  disabled={freezingAccountId === acc.id}
                  className={`px-2 py-1 text-xs rounded border transition-colors flex items-center gap-1 ${
                    isFrozen
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                  }`}
                  title={isFrozen ? 'Unlock account' : 'Temporarily lock account'}
                >
                  {isFrozen ? (
                    <>
                      <Unlock className="w-3 h-3" />
                      <span>Unlock</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3" />
                      <span>Lock A/c</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* OPEN ACCOUNT MODAL */}
      {isOpeningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white border border-slate-300 rounded-lg shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Open New Bank Account
                </h3>
                <p className="text-xs text-slate-500">
                  Select deposit product and branch for immediate provisioning
                </p>
              </div>
              <button
                onClick={() => setIsOpeningModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Product Type *
                </label>
                <select
                  value={newAccType}
                  onChange={(e) => setNewAccType(e.target.value as AccountType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-700 bg-white"
                >
                  <option value="SAVINGS">Savings Bank Account (3.50% p.a.)</option>
                  <option value="CURRENT">Current Account (For Business / Overdraft)</option>
                  <option value="SALARY">Corporate Salary Account (Zero Balance)</option>
                  <option value="FIXED_DEPOSIT">Term Deposit / Fixed Deposit (7.10% p.a.)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Account Nickname / Purpose
                </label>
                <input
                  type="text"
                  value={newAccNickname}
                  onChange={(e) => setNewAccNickname(e.target.value)}
                  placeholder="e.g. Tax Savings / Emergency Fund"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Initial Deposit Amount (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={newAccDeposit}
                  onChange={(e) => setNewAccDeposit(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Home Branch
                </label>
                <select
                  value={newAccBranch}
                  onChange={(e) => setNewAccBranch(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-700 bg-white"
                >
                  <option value="Connaught Place Branch, New Delhi">Connaught Place Branch, New Delhi (FINC0001004)</option>
                  <option value="Nariman Point Branch, Mumbai">Nariman Point Branch, Mumbai (FINC0002011)</option>
                  <option value="MG Road Branch, Bengaluru">MG Road Branch, Bengaluru (FINC0003088)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nominee Legal Full Name (Optional)
                </label>
                <input
                  type="text"
                  value={nomineeName}
                  onChange={(e) => setNomineeName(e.target.value)}
                  placeholder="e.g. Ananya Verma"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-700"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsOpeningModal(false)}
                  className="px-3 py-2 text-slate-700 hover:bg-slate-100 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 font-semibold text-white bg-blue-900 hover:bg-blue-850 rounded shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Provisioning...' : 'Open Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
