import React, { useState } from 'react';
import { useBanking } from '../../context/BankingContext';
import { Beneficiary } from '../../types';
import { formatINR, maskAccountNumber } from '../../services/demoDataProvider';
import {
  UserCheck,
  PlusCircle,
  Trash2,
  Send,
  Building2,
  AlertCircle,
  CheckCircle2,
  Search,
  Shield,
  X,
} from 'lucide-react';

interface Props {
  onTransferToBeneficiary: (ben: Beneficiary) => void;
}

export const BeneficiariesView: React.FC<Props> = ({ onTransferToBeneficiary }) => {
  const { beneficiaries, addBeneficiary, removeBeneficiary, isDemoMode } = useBanking();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [nickname, setNickname] = useState('');
  const [accountType, setAccountType] = useState<'SAVINGS' | 'CURRENT'>('SAVINGS');
  const [transferLimit, setTransferLimit] = useState('200000');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-detect bank from common IFSC prefixes
  const handleIfscChange = (val: string) => {
    const uppercaseVal = val.toUpperCase().trim();
    setIfscCode(uppercaseVal);
    if (uppercaseVal.startsWith('SBIN')) {
      setBankName('State Bank of India');
    } else if (uppercaseVal.startsWith('HDFC')) {
      setBankName('HDFC Bank Ltd');
    } else if (uppercaseVal.startsWith('ICIC')) {
      setBankName('ICICI Bank Ltd');
    } else if (uppercaseVal.startsWith('PUNB')) {
      setBankName('Punjab National Bank');
    } else if (uppercaseVal.startsWith('BARB')) {
      setBankName('Bank of Baroda');
    } else if (uppercaseVal.startsWith('AXIS') || uppercaseVal.startsWith('UTIB')) {
      setBankName('Axis Bank Ltd');
    } else if (uppercaseVal.startsWith('KKBK')) {
      setBankName('Kotak Mahindra Bank');
    } else if (uppercaseVal.startsWith('FINC')) {
      setBankName('FinCore Bank');
    }
  };

  const handleAddBeneficiary = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!name.trim()) {
      setFormError('Beneficiary legal name is required.');
      return;
    }

    if (!accountNumber.trim() || accountNumber.length < 6) {
      setFormError('Please enter a valid bank account number (at least 6 digits).');
      return;
    }

    if (accountNumber !== confirmAccountNumber) {
      setFormError('Account number and Confirm Account number do not match.');
      return;
    }

    // Validate Indian IFSC code format: 4 alphabets, '0', 6 alphanumeric characters
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifscCode)) {
      setFormError('Invalid Indian IFSC Code format. Example: SBIN0000691 or HDFC0000060 (11 characters: 4 letters, 0, 6 letters/digits).');
      return;
    }

    setIsSubmitting(true);
    try {
      await addBeneficiary({
        name: name.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim(),
        bankName: bankName.trim() || 'Scheduled Commercial Bank',
        branchName: branchName.trim() || 'Main Branch',
        nickname: nickname.trim() || undefined,
        accountType,
        transferLimit: parseFloat(transferLimit) || 100000,
        routingNumber: ifscCode.trim(),
      });

      setFormSuccess('Beneficiary registered successfully. Active for IMPS, NEFT and RTGS transfers.');
      setTimeout(() => {
        setIsAddModalOpen(false);
        setName('');
        setAccountNumber('');
        setConfirmAccountNumber('');
        setIfscCode('');
        setBankName('');
        setBranchName('');
        setNickname('');
        setFormSuccess(null);
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register beneficiary';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBeneficiaries = beneficiaries.filter((b) => {
    const q = searchTerm.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.accountNumber.includes(q) ||
      b.ifscCode.toLowerCase().includes(q) ||
      b.bankName.toLowerCase().includes(q) ||
      (b.nickname && b.nickname.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Registered Beneficiaries
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Manage verified payees for IMPS, NEFT, and RTGS electronic fund transfers
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-850 rounded transition-colors shadow-sm shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-amber-300" />
          <span>Add New Beneficiary</span>
        </button>
      </div>

      {/* Safety & Cooling Off Advisory */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
        <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-950">Security Notice:</span>{' '}
          Please ensure the beneficiary account number and IFSC code match their passbook or cheque leaf.
          Newly registered payees are protected by safety limits during the initial activation window.
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by beneficiary name, account number, bank, or IFSC code..."
          className="w-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-slate-400 hover:text-slate-600 mr-1"
          >
            Clear
          </button>
        )}
      </div>

      {/* Beneficiaries Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {filteredBeneficiaries.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <UserCheck className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">No Beneficiaries Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm
                ? 'No registered payees matched your search criteria.'
                : 'You have not added any beneficiaries yet. Register a payee to transfer funds.'}
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-900 rounded hover:bg-blue-850"
            >
              Add First Beneficiary
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider bg-slate-50 font-semibold">
                  <th className="py-3 px-4">Payee Name</th>
                  <th className="py-3 px-4">Bank Name &amp; Branch</th>
                  <th className="py-3 px-4">Account Number</th>
                  <th className="py-3 px-4">IFSC Code</th>
                  <th className="py-3 px-4">Transfer Limit</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBeneficiaries.map((ben) => (
                  <tr key={ben.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{ben.name}</div>
                      {ben.nickname && (
                        <div className="text-[11px] text-slate-500">Alias: {ben.nickname}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="font-medium text-slate-800">{ben.bankName}</div>
                      <div className="text-[11px] text-slate-500">{ben.branchName || 'Main Branch'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                      {maskAccountNumber(ben.accountNumber)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-900">
                      {ben.ifscCode}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-800">
                      {ben.transferLimit ? formatINR(ben.transferLimit) : '₹2,00,000.00'}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onTransferToBeneficiary(ben)}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-850 rounded flex items-center gap-1 transition-colors"
                        >
                          <Send className="w-3 h-3 text-amber-300" />
                          <span>Transfer</span>
                        </button>
                        <button
                          onClick={() => removeBeneficiary(ben.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Remove Beneficiary"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <span>Total Registered Payees: <strong className="text-slate-800">{beneficiaries.length}</strong></span>
          <span className="font-mono text-[11px]">Valid for IMPS / NEFT / RTGS</span>
        </div>
      </div>

      {/* ADD BENEFICIARY MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white border border-slate-300 rounded-lg shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Add Beneficiary / Payee
                </h3>
                <p className="text-xs text-slate-500">
                  Register recipient account for electronic funds transfer
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddBeneficiary} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Beneficiary Legal Name (as per Bank Records) *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ananya Verma"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Beneficiary Account Number *
                  </label>
                  <input
                    type="password"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter account number"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Confirm Account Number *
                  </label>
                  <input
                    type="text"
                    value={confirmAccountNumber}
                    onChange={(e) => setConfirmAccountNumber(e.target.value)}
                    placeholder="Re-enter account number"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    IFSC Code (11 digits) *
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    value={ifscCode}
                    onChange={(e) => handleIfscChange(e.target.value)}
                    placeholder="e.g. SBIN0000691"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono uppercase text-slate-900 focus:outline-none focus:border-blue-700"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Format: 4 letters, 0, 6 digits/letters</span>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. State Bank of India"
                    className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Account Type
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as 'SAVINGS' | 'CURRENT')}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-700 bg-white"
                  >
                    <option value="SAVINGS">Savings Account</option>
                    <option value="CURRENT">Current Account</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Per-Transaction Limit (₹)
                  </label>
                  <input
                    type="number"
                    value={transferLimit}
                    onChange={(e) => setTransferLimit(e.target.value)}
                    placeholder="200000"
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nickname / Alias (Optional)
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. Sister / Landlord"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-700"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 text-slate-700 hover:bg-slate-100 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 font-semibold text-white bg-blue-900 hover:bg-blue-850 rounded shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Register Beneficiary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
