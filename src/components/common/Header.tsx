import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBanking } from '../../context/BankingContext';
import {
  Menu,
  X,
  Send,
  LogOut,
  User as UserIcon,
  Server,
  Building2,
  ChevronDown,
} from 'lucide-react';

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenBackendHub: () => void;
  onOpenQuickTransfer: () => void;
}

export const Header: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  onOpenBackendHub,
  onOpenQuickTransfer,
}) => {
  const { user, logout } = useAuth();
  const { backendHealth, isDemoMode, accounts, selectedAccount, setSelectedAccountId } = useBanking();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'accounts', label: 'My Accounts' },
    { id: 'transfer', label: 'Fund Transfer' },
    { id: 'beneficiaries', label: 'Beneficiaries' },
    { id: 'transactions', label: 'Transaction History' },
    { id: 'statements', label: 'Statements' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#092244] border-b-2 border-amber-600 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-6">
          {/* Brand Wordmark & Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2.5 text-left focus:outline-none"
            >
              <div className="w-8 h-8 rounded bg-white/10 border border-white/20 flex items-center justify-center text-amber-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white block leading-none">
                  FinCore
                </span>
                <span className="text-[10px] text-amber-300 font-medium tracking-wide">
                  Indian Banking Portal
                </span>
              </div>
            </button>

            {/* Account Quick Selector Dropdown */}
            {accounts.length > 0 && selectedAccount && (
              <div className="relative hidden xl:block ml-4">
                <button
                  onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1 text-xs rounded bg-white/10 hover:bg-white/15 border border-white/20 text-slate-100 transition-colors"
                >
                  <span className="font-medium truncate max-w-[150px]">
                    {selectedAccount.nickname || selectedAccount.accountType}
                  </span>
                  <span className="font-mono text-slate-300 text-[11px]">
                    (••{selectedAccount.accountNumber.slice(-4)})
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-300" />
                </button>

                {accountDropdownOpen && (
                  <div className="absolute left-0 mt-1.5 w-72 bg-white border border-slate-200 rounded shadow-lg z-50 py-1 text-slate-800 divide-y divide-slate-100">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                      Select Active Account
                    </div>
                    {accounts.map((acc) => (
                      <button
                        key={acc.id}
                        onClick={() => {
                          setSelectedAccountId(acc.id);
                          setAccountDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                          acc.id === selectedAccount.id ? 'bg-blue-50 font-semibold text-blue-900' : 'text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-slate-900">{acc.nickname || acc.accountType}</div>
                          <div className="text-[11px] font-mono text-slate-500">{acc.accountNumber}</div>
                        </div>
                        <span className="font-mono text-slate-900 font-medium">
                          ₹{acc.availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Links (Clean, text-based with active saffron underline) */}
          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`py-1 text-xs whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                    isActive
                      ? 'text-white border-amber-400 font-bold'
                      : 'text-slate-200 border-transparent hover:text-white hover:border-slate-400'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Primary Action & Profile Zone */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Quick Transfer Button */}
            <button
              onClick={onOpenQuickTransfer}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Transfer Money</span>
            </button>

            {/* Backend Hub Trigger Button */}
            <button
              onClick={onOpenBackendHub}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 border border-white/20 rounded transition-colors"
              title="Java 21 Spring Boot Backend Specs & Postman"
            >
              <Server className="w-3.5 h-3.5 text-amber-300" />
              <span>Java Backend</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  backendHealth.connected && !isDemoMode ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            </button>

            {/* User Profile Info */}
            {user && (
              <div className="hidden md:flex items-center gap-2.5 pl-3 border-l border-white/20">
                <div className="text-right">
                  <div className="text-xs font-semibold text-white leading-tight">
                    {user.fullName}
                  </div>
                  <div className="text-[10px] text-slate-300 font-mono">
                    CIF: {user.cifNumber || 'CIF88390192'}
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="p-1.5 text-slate-300 hover:text-rose-300 hover:bg-white/10 rounded transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-slate-200 hover:text-white focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0a1e3a] border-t border-white/10 px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs rounded transition-colors ${
                currentTab === item.id
                  ? 'bg-white/15 text-white font-bold'
                  : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              {item.label}
            </button>
          ))}

          <div className="pt-2 border-t border-white/10 flex flex-col gap-1.5">
            <button
              onClick={() => {
                onOpenBackendHub();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-white/10 rounded flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-amber-300" />
                Java Backend &amp; MySQL Hub
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-amber-300">
                {backendHealth.connected && !isDemoMode ? 'LIVE' : 'DEMO'}
              </span>
            </button>

            {user && (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-rose-300 hover:bg-rose-950/20 rounded flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout ({user.fullName})</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
