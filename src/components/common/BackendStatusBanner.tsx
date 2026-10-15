import React from 'react';
import { useBanking } from '../../context/BankingContext';
import { RefreshCw, Server } from 'lucide-react';

interface Props {
  onOpenBackendHub: () => void;
}

export const BackendStatusBanner: React.FC<Props> = ({ onOpenBackendHub }) => {
  const { backendHealth, isDemoMode, toggleDemoMode, checkHealth, isLoading } = useBanking();

  if (backendHealth.connected && !isDemoMode) {
    return (
      <aside aria-label="Backend status" className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs text-emerald-900">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span className="font-semibold text-emerald-950">Connected to Java Spring Boot REST API:</span>
            <span className="font-mono text-emerald-800">{backendHealth.url}</span>
            <span className="text-emerald-400 hidden sm:inline">·</span>
            <span className="text-emerald-800 hidden sm:inline">Latency: {backendHealth.latencyMs}ms</span>
            <span className="text-emerald-400 hidden md:inline">·</span>
            <span className="text-emerald-800 hidden md:inline">MySQL Database Authoritative</span>
          </div>
          <button
            onClick={onOpenBackendHub}
            className="px-2.5 py-1 text-xs text-emerald-900 bg-white hover:bg-emerald-100 rounded border border-emerald-300 font-medium transition-colors shrink-0"
          >
            API Contract &amp; Postman
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside aria-label="Backend status" className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-600"></span>
          <div>
            <span className="font-semibold text-amber-950">Demonstration Mode Active:</span>{' '}
            <span className="text-amber-900">
              Displaying simulated Indian netbanking preview data. For live banking persistence, connect your Java 21 Spring Boot backend at{' '}
              <span className="font-mono font-medium text-amber-950">{backendHealth.url}</span>.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <button
            onClick={() => checkHealth()}
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1 text-amber-900 bg-white hover:bg-amber-100 rounded border border-amber-300 transition-colors"
            title="Probe Spring Boot endpoint"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Test Connection</span>
          </button>

          <button
            onClick={toggleDemoMode}
            className="px-2.5 py-1 text-amber-900 bg-white hover:bg-amber-100 rounded border border-amber-300 transition-colors"
          >
            {isDemoMode ? 'Switch to Live Mode' : 'Switch to Demo Mode'}
          </button>

          <button
            onClick={onOpenBackendHub}
            className="flex items-center gap-1.5 px-3 py-1 font-semibold text-white bg-blue-900 hover:bg-blue-850 rounded transition-colors"
          >
            <Server className="w-3.5 h-3.5" />
            <span>Java Backend &amp; Postman</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
