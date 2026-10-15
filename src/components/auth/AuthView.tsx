import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBanking } from '../../context/BankingContext';
import {
  Lock,
  User,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Building2,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

interface Props {
  onSuccess?: () => void;
  onOpenBackendHub: () => void;
}

export const AuthView: React.FC<Props> = ({ onSuccess, onOpenBackendHub }) => {
  const { login, register, authError, clearAuthError, isLoading } = useAuth();
  const { isDemoMode, backendHealth } = useBanking();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [username, setUsername] = useState('rohan.sharma');
  const [password, setPassword] = useState('password123');
  const [email, setEmail] = useState('rohan.sharma@example.in');
  const [fullName, setFullName] = useState('Rohan Sharma');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [clientError, setClientError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);
    clearAuthError();

    if (!username.trim() || !password.trim()) {
      setClientError('User ID and Password are required.');
      return;
    }

    if (mode === 'register') {
      if (!email.trim() || !fullName.trim()) {
        setClientError('Email and full name are required to register.');
        return;
      }
      const success = await register(
        {
          username: username.trim(),
          password: password.trim(),
          email: email.trim(),
          fullName: fullName.trim(),
          phone: phone.trim() || undefined,
        },
        isDemoMode
      );
      if (success && onSuccess) {
        onSuccess();
      }
    } else {
      const success = await login(
        {
          username: username.trim(),
          password: password.trim(),
        },
        isDemoMode
      );
      if (success && onSuccess) {
        onSuccess();
      }
    }
  };

  const handleFillDemo = () => {
    setUsername('rohan.sharma');
    setPassword('password123');
    setEmail('rohan.sharma@example.in');
    setFullName('Rohan Sharma');
    setPhone('+91 98765 43210');
    setClientError(null);
    clearAuthError();
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-300 rounded-lg shadow-sm p-6 sm:p-8 space-y-5">
        {/* Bank Brand Header */}
        <div className="text-center space-y-1.5 border-b border-slate-200 pb-4">
          <div className="w-10 h-10 rounded bg-[#092244] text-amber-400 flex items-center justify-center mx-auto mb-2">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            FinCore NetBanking Portal
          </h1>
          <p className="text-xs text-slate-500">
            {mode === 'login'
              ? 'Secure Customer Login for Indian Internet Banking'
              : 'Register for FinCore Internet Banking Services'}
          </p>
        </div>

        {/* Backend Connectivity Status Strip */}
        <div
          className={`p-2.5 rounded text-xs flex items-center justify-between gap-2 border ${
            backendHealth.connected && !isDemoMode
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                backendHealth.connected && !isDemoMode ? 'bg-emerald-600' : 'bg-amber-600'
              }`}
            />
            <span className="truncate">
              {backendHealth.connected && !isDemoMode
                ? `Spring Boot: ${backendHealth.url}`
                : 'Demo Mode Active (Offline)'}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenBackendHub}
            className="text-[11px] font-semibold text-blue-900 hover:underline shrink-0"
          >
            Config
          </button>
        </div>

        {/* Error Notification */}
        {(clientError || authError) && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{clientError || authError}</span>
          </div>
        )}

        {/* Login / Register Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Customer Full Name *</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rohan Sharma"
                    required
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rohan.sharma@example.in"
                    required
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Registered Mobile Number (+91)</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-700"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Customer User ID *</label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="rohan.sharma"
                required
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-700"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-700 font-semibold">NetBanking Password *</label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="text-[11px] text-blue-900 font-semibold hover:underline"
                >
                  Quick Fill Demo
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-700"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-850 text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <span>{isLoading ? 'Verifying Credentials...' : mode === 'login' ? 'Login to NetBanking' : 'Complete Registration'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
          </button>
        </form>

        {/* Switch Mode */}
        <div className="text-center pt-2 border-t border-slate-200 text-xs text-slate-600">
          {mode === 'login' ? (
            <span>
              New to FinCore NetBanking?{' '}
              <button
                onClick={() => {
                  setMode('register');
                  clearAuthError();
                }}
                className="text-blue-900 font-bold hover:underline"
              >
                Register here
              </button>
            </span>
          ) : (
            <span>
              Already have an enrolled ID?{' '}
              <button
                onClick={() => {
                  setMode('login');
                  clearAuthError();
                }}
                className="text-blue-900 font-bold hover:underline"
              >
                Sign In
              </button>
            </span>
          )}
        </div>

        {/* Safety Advisory */}
        <div className="text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-200 flex items-start gap-1.5 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <span>
            FinCore Bank never asks for your NetBanking password, OTP, or UPI PIN via email or phone call. Always ensure the lock icon in the browser address bar is active.
          </span>
        </div>
      </div>
    </div>
  );
};
