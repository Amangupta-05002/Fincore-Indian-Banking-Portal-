import React, { useState, useEffect } from 'react';
import { useBanking } from '../../context/BankingContext';
import { Beneficiary, TransferMode, TransferRequest, TransferResponse } from '../../types';
import { formatINR, maskAccountNumber } from '../../services/demoDataProvider';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Printer,
  RefreshCw,
  Building2,
  ShieldCheck,
  Info,
} from 'lucide-react';

interface Props {
  preselectedBeneficiary?: Beneficiary | null;
}

export const TransfersView: React.FC<Props> = ({ preselectedBeneficiary }) => {
  const {
    accounts,
    selectedAccount,
    setSelectedAccountId,
    beneficiaries,
    addBeneficiary,
    executeTransfer,
    isDemoMode,
  } = useBanking();

  // Form states
  const [sourceAccountId, setSourceAccountId] = useState(selectedAccount?.id || '');
  const [transferMode, setTransferMode] = useState<TransferMode>('IMPS');
  const [beneficiaryMode, setBeneficiaryMode] = useState<'saved' | 'new'>(
    preselectedBeneficiary ? 'saved' : 'saved'
  );
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState(
    preselectedBeneficiary?.id || ''
  );

  // New beneficiary fields
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryAccountNumber, setBeneficiaryAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [beneficiaryIfsc, setBeneficiaryIfsc] = useState('');
  const [beneficiaryBank, setBeneficiaryBank] = useState('');
  const [saveBeneficiaryCheck, setSaveBeneficiaryCheck] = useState(false);

  // Transfer parameters
  const [amount, setAmount] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // Workflow states
  const [step, setStep] = useState<'form' | 'confirm' | 'processing' | 'receipt'>('form');
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');
  const [receipt, setReceipt] = useState<TransferResponse | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedAccount && !sourceAccountId) {
      setSourceAccountId(selectedAccount.id);
    }
  }, [selectedAccount, sourceAccountId]);

  useEffect(() => {
    if (preselectedBeneficiary) {
      setSelectedBeneficiaryId(preselectedBeneficiary.id);
      setBeneficiaryMode('saved');
    } else if (beneficiaries.length > 0 && !selectedBeneficiaryId) {
      setSelectedBeneficiaryId(beneficiaries[0].id);
    }
  }, [preselectedBeneficiary, beneficiaries, selectedBeneficiaryId]);

  const currentSourceAccount = accounts.find((a) => a.id === sourceAccountId) || selectedAccount;
  const numAmount = parseFloat(amount) || 0;

  // Validation
  const validateForm = (): boolean => {
    setFormError(null);

    if (!currentSourceAccount) {
      setFormError('Please select a valid debiting account.');
      return false;
    }

    if (currentSourceAccount.status === 'FROZEN') {
      setFormError('This debit account is locked/frozen and cannot initiate transfers.');
      return false;
    }

    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid transfer amount greater than ₹0.00.');
      return false;
    }

    if (numAmount > currentSourceAccount.availableBalance) {
      setFormError(
        `Insufficient balance. Available: ${formatINR(currentSourceAccount.availableBalance)}, Transfer amount: ${formatINR(numAmount)}`
      );
      return false;
    }

    // Indian Payment Modes Validation
    if (transferMode === 'RTGS' && numAmount < 200000) {
      setFormError('RTGS (Real Time Gross Settlement) requires a minimum transfer amount of ₹2,00,000. Please select IMPS or NEFT for lower amounts.');
      return false;
    }

    if (transferMode === 'IMPS' && numAmount > 500000) {
      setFormError('IMPS (Immediate Payment Service) limit is ₹5,00,000 per transaction. Please choose NEFT or RTGS for amounts above ₹5,00,000.');
      return false;
    }

    if (beneficiaryMode === 'saved') {
      if (!selectedBeneficiaryId) {
        setFormError('Please select a registered beneficiary.');
        return false;
      }
    } else {
      if (!beneficiaryName.trim()) {
        setFormError('Beneficiary legal name is required.');
        return false;
      }
      if (!beneficiaryAccountNumber.trim() || beneficiaryAccountNumber.trim().length < 6) {
        setFormError('A valid beneficiary account number (minimum 6 digits) is required.');
        return false;
      }
      if (beneficiaryAccountNumber !== confirmAccountNumber) {
        setFormError('Beneficiary account number and confirmation account number do not match.');
        return false;
      }
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(beneficiaryIfsc.trim().toUpperCase())) {
        setFormError('Invalid Indian IFSC Code format (11 characters: e.g. SBIN0000691).');
        return false;
      }
    }

    return true;
  };

  const handleProceedToConfirm = () => {
    if (!validateForm()) return;
    const newIdemKey = `UTR-FC-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setIdempotencyKey(newIdemKey);
    setStep('confirm');
  };

  const handleConfirmAndExecute = async () => {
    if (!currentSourceAccount) return;
    setIsSubmitting(true);
    setStep('processing');
    setFormError(null);

    try {
      let finalDestAccNum = '';
      let finalBenName = '';
      let finalBenIfsc = '';
      let finalBenBank = '';

      if (beneficiaryMode === 'saved') {
        const ben = beneficiaries.find((b) => b.id === selectedBeneficiaryId);
        if (!ben) throw new Error('Beneficiary record not found');
        finalDestAccNum = ben.accountNumber;
        finalBenName = ben.name;
        finalBenIfsc = ben.ifscCode;
        finalBenBank = ben.bankName;
      } else {
        finalDestAccNum = beneficiaryAccountNumber.trim();
        finalBenName = beneficiaryName.trim();
        finalBenIfsc = beneficiaryIfsc.trim().toUpperCase();
        finalBenBank = beneficiaryBank.trim() || 'Beneficiary Commercial Bank';

        if (saveBeneficiaryCheck) {
          try {
            await addBeneficiary({
              name: finalBenName,
              accountNumber: finalDestAccNum,
              ifscCode: finalBenIfsc,
              bankName: finalBenBank,
              nickname: finalBenName.split(' ')[0],
              accountType: 'SAVINGS',
              routingNumber: finalBenIfsc,
            });
          } catch {
            // Non-blocking
          }
        }
      }

      const requestPayload: TransferRequest = {
        sourceAccountId: currentSourceAccount.id,
        destinationAccountNumber: finalDestAccNum,
        beneficiaryName: finalBenName,
        beneficiaryBankCode: finalBenBank,
        beneficiaryIfsc: finalBenIfsc,
        transferMode,
        amount: numAmount,
        description: remarks.trim() || `${transferMode} Transfer`,
        idempotencyKey,
      };

      const response = await executeTransfer(requestPayload);
      setReceipt(response);
      setStep('receipt');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fund transfer could not be confirmed';
      setFormError(msg);
      setStep('confirm');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setRemarks('');
    setStep('form');
    setReceipt(null);
    setFormError(null);
  };

  const activeBeneficiary =
    beneficiaryMode === 'saved'
      ? beneficiaries.find((b) => b.id === selectedBeneficiaryId)
      : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Electronic Fund Transfer
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Transfer money seamlessly via IMPS (Instant 24x7), NEFT, or RTGS
        </p>
      </div>

      {/* STEP 1: FORM INPUT */}
      {step === 'form' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-sm space-y-6">
          {formError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* 1. Debit Account Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Select Debiting Account
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {accounts.map((acc) => {
                const isSelected = acc.id === sourceAccountId;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      setSourceAccountId(acc.id);
                      setSelectedAccountId(acc.id);
                    }}
                    className={`text-left p-3 rounded border transition-all ${
                      isSelected
                        ? 'border-blue-900 bg-blue-50/50 ring-1 ring-blue-900'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-900 truncate">
                        {acc.nickname || acc.accountType}
                      </span>
                      {acc.status === 'FROZEN' && (
                        <span className="text-[10px] text-rose-600 font-mono font-bold">LOCKED</span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-600 mb-1">
                      {maskAccountNumber(acc.accountNumber)}
                    </div>
                    <div className="text-xs font-mono font-bold text-[#092244] tabular-nums">
                      {formatINR(acc.availableBalance)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Transfer Mode Selector with Explanatory Descriptions */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              2. Transfer Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* IMPS */}
              <button
                type="button"
                onClick={() => setTransferMode('IMPS')}
                className={`p-3 rounded border text-left transition-all ${
                  transferMode === 'IMPS'
                    ? 'border-blue-900 bg-blue-50/50 ring-1 ring-blue-900'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">IMPS</span>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                    Instant 24x7
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Immediate Payment Service. Real-time credit up to ₹5,00,000 per transfer.
                </p>
              </button>

              {/* NEFT */}
              <button
                type="button"
                onClick={() => setTransferMode('NEFT')}
                className={`p-3 rounded border text-left transition-all ${
                  transferMode === 'NEFT'
                    ? 'border-blue-900 bg-blue-50/50 ring-1 ring-blue-900'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">NEFT</span>
                  <span className="text-[10px] font-semibold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded">
                    Batch 24x7
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  National Electronic Funds Transfer. Settled in half-hourly cycles. No upper limit.
                </p>
              </button>

              {/* RTGS */}
              <button
                type="button"
                onClick={() => setTransferMode('RTGS')}
                className={`p-3 rounded border text-left transition-all ${
                  transferMode === 'RTGS'
                    ? 'border-blue-900 bg-blue-50/50 ring-1 ring-blue-900'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">RTGS</span>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                    Min ₹2 Lakh
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Real Time Gross Settlement. High-value instant settlement. Minimum ₹2,00,000.
                </p>
              </button>
            </div>
          </div>

          {/* 3. Beneficiary Selection */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                3. Beneficiary (Payee) Details
              </label>
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setBeneficiaryMode('saved')}
                  className={`px-3 py-1 rounded transition-colors ${
                    beneficiaryMode === 'saved'
                      ? 'bg-blue-900 text-white font-medium'
                      : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                  }`}
                >
                  Saved Beneficiaries ({beneficiaries.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBeneficiaryMode('new')}
                  className={`px-3 py-1 rounded transition-colors ${
                    beneficiaryMode === 'new'
                      ? 'bg-blue-900 text-white font-medium'
                      : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                  }`}
                >
                  One-Time / New Payee
                </button>
              </div>
            </div>

            {beneficiaryMode === 'saved' ? (
              <div className="space-y-2">
                {beneficiaries.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-500">
                    No saved beneficiaries found. Please switch to "One-Time / New Payee".
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {beneficiaries.map((ben) => {
                      const isSelected = ben.id === selectedBeneficiaryId;
                      return (
                        <button
                          key={ben.id}
                          type="button"
                          onClick={() => setSelectedBeneficiaryId(ben.id)}
                          className={`text-left p-3 rounded border transition-all ${
                            isSelected
                              ? 'border-blue-900 bg-blue-50/50 ring-1 ring-blue-900'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="font-bold text-xs text-slate-900 flex justify-between">
                            <span>{ben.name}</span>
                            <span className="font-mono text-[11px] text-blue-900 font-semibold">{ben.ifscCode}</span>
                          </div>
                          <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                            {ben.bankName}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            A/c: {maskAccountNumber(ben.accountNumber)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 bg-slate-50 p-4 rounded border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Beneficiary Full Legal Name *
                    </label>
                    <input
                      type="text"
                      value={beneficiaryName}
                      onChange={(e) => setBeneficiaryName(e.target.value)}
                      placeholder="e.g. Ananya Verma"
                      className="w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-700 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Beneficiary IFSC Code *
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={beneficiaryIfsc}
                      onChange={(e) => setBeneficiaryIfsc(e.target.value.toUpperCase())}
                      placeholder="e.g. SBIN0000691"
                      className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-mono uppercase text-slate-900 focus:outline-none focus:border-blue-700 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Beneficiary Account Number *
                    </label>
                    <input
                      type="password"
                      value={beneficiaryAccountNumber}
                      onChange={(e) => setBeneficiaryAccountNumber(e.target.value)}
                      placeholder="Enter account number"
                      className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-700 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Confirm Account Number *
                    </label>
                    <input
                      type="text"
                      value={confirmAccountNumber}
                      onChange={(e) => setConfirmAccountNumber(e.target.value)}
                      placeholder="Re-enter account number"
                      className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-700 bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="savePayee"
                    checked={saveBeneficiaryCheck}
                    onChange={(e) => setSaveBeneficiaryCheck(e.target.checked)}
                    className="rounded text-blue-900 focus:ring-0"
                  />
                  <label htmlFor="savePayee" className="text-xs text-slate-700 cursor-pointer">
                    Save this payee to my registered beneficiaries list
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* 4. Amount and Remarks */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              4. Transfer Amount &amp; Remarks
            </label>

            <div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-bold text-slate-600 font-mono">
                  ₹
                </span>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded text-lg font-bold font-mono text-slate-900 focus:outline-none focus:border-blue-700 tabular-nums"
                />
              </div>

              {/* Quick Amount presets */}
              <div className="flex items-center gap-2 mt-2">
                {[1000, 5000, 25000, 100000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(String(preset))}
                    className="px-2.5 py-1 text-xs font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 transition-colors"
                  >
                    +₹{preset.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Remarks / Purpose (Optional)
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Rent for Oct / Invoice settlement"
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-700"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleProceedToConfirm}
              className="w-full py-3 px-4 bg-blue-900 hover:bg-blue-850 text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Review &amp; Confirm Transfer</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CONFIRMATION MODAL / STEP */}
      {step === 'confirm' && currentSourceAccount && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              Confirm Electronic Transfer ({transferMode})
            </h2>
            <p className="text-xs text-slate-500">
              Please verify beneficiary and debit account details before final authorization
            </p>
          </div>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="bg-slate-50 rounded border border-slate-200 divide-y divide-slate-200 text-xs">
            <div className="p-3 flex justify-between">
              <span className="text-slate-600">Debiting Account:</span>
              <div className="text-right">
                <div className="font-bold text-slate-900">{currentSourceAccount.nickname || currentSourceAccount.accountType}</div>
                <div className="font-mono text-slate-600 text-[11px]">{maskAccountNumber(currentSourceAccount.accountNumber)}</div>
              </div>
            </div>

            <div className="p-3 flex justify-between">
              <span className="text-slate-600">Beneficiary Name:</span>
              <span className="font-bold text-slate-900">
                {beneficiaryMode === 'saved' ? activeBeneficiary?.name : beneficiaryName}
              </span>
            </div>

            <div className="p-3 flex justify-between">
              <span className="text-slate-600">Beneficiary A/c &amp; IFSC:</span>
              <div className="text-right font-mono">
                <div className="text-slate-900">
                  {beneficiaryMode === 'saved' ? activeBeneficiary?.accountNumber : beneficiaryAccountNumber}
                </div>
                <div className="text-blue-900 font-semibold text-[11px]">
                  IFSC: {beneficiaryMode === 'saved' ? activeBeneficiary?.ifscCode : beneficiaryIfsc}
                </div>
              </div>
            </div>

            <div className="p-3 flex justify-between items-center">
              <span className="text-slate-600">Transfer Mode:</span>
              <span className="font-mono font-bold text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded text-[11px]">
                {transferMode}
              </span>
            </div>

            <div className="p-3 flex justify-between items-center bg-blue-50/40">
              <span className="font-semibold text-slate-800">Transfer Amount:</span>
              <span className="font-mono font-bold text-base text-[#092244] tabular-nums">
                {formatINR(numAmount)}
              </span>
            </div>

            <div className="p-3 flex justify-between">
              <span className="text-slate-600">Bank Service Charges:</span>
              <span className="font-mono text-emerald-800 font-semibold">₹0.00 (Waived)</span>
            </div>

            <div className="p-3 flex justify-between">
              <span className="text-slate-600">Balance After Transfer:</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {formatINR(currentSourceAccount.availableBalance - numAmount)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep('form')}
              className="w-1/3 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded transition-colors"
            >
              Modify
            </button>
            <button
              type="button"
              onClick={handleConfirmAndExecute}
              className="w-2/3 py-2.5 px-4 bg-blue-900 hover:bg-blue-850 text-white text-xs font-bold rounded transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Send className="w-3.5 h-3.5 text-amber-300" />
              <span>Authorize &amp; Transfer</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PROCESSING */}
      {step === 'processing' && (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-4 shadow-sm">
          <RefreshCw className="w-8 h-8 text-blue-900 animate-spin mx-auto" />
          <h2 className="text-base font-bold text-slate-900">
            Communicating with Banking Engine ({transferMode})
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Dispatched idempotency token <code className="font-mono text-slate-800">{idempotencyKey}</code> to Java Spring Boot. Awaiting confirmation...
          </p>
        </div>
      )}

      {/* STEP 4: RECEIPT */}
      {step === 'receipt' && receipt && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-5">
          <div className="text-center space-y-1.5 border-b border-slate-200 pb-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Transfer Successful
            </h2>
            <p className="text-xs text-slate-600">{receipt.message}</p>
            {isDemoMode && (
              <span className="inline-block text-[10px] font-mono font-medium text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded mt-1">
                DEMONSTRATION RECEIPT (Spring Boot Offline)
              </span>
            )}
          </div>

          <div className="bg-slate-50 rounded border border-slate-200 p-4 space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">UTR / Reference No:</span>
              <span className="font-mono font-bold text-blue-900">{receipt.transactionReference}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Settled Amount:</span>
              <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                {formatINR(receipt.amount)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Debited Account:</span>
              <span className="font-mono text-slate-800">{receipt.sourceAccountNumber}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Beneficiary Payee:</span>
              <span className="font-semibold text-slate-900">
                {receipt.beneficiaryName} ({receipt.destinationAccountNumber})
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Transfer Mode:</span>
              <span className="font-mono font-bold text-slate-800">{receipt.transferMode || transferMode}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Transaction Time:</span>
              <span className="font-mono text-slate-700">{new Date(receipt.timestamp).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Updated Available Balance:</span>
              <span className="font-mono font-bold text-emerald-800 tabular-nums">
                {formatINR(receipt.sourceAvailableBalance)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 font-medium transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Acknowledgement</span>
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-850 rounded transition-colors"
            >
              Initiate Another Transfer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
