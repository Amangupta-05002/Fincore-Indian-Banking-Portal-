import React, { useState } from 'react';
import { useBanking } from '../../context/BankingContext';
import {
  SPRING_BOOT_POM_XML,
  APPLICATION_YML,
  MYSQL_SCHEMA_SQL,
  SPRING_SECURITY_CONFIG,
  SPRING_TRANSFER_CONTROLLER,
  generatePostmanCollection,
} from '../../services/springBootDocs';
import {
  X,
  Server,
  Database,
  Code2,
  FileText,
  Download,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const JavaBackendHubModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { backendHealth, apiBaseUrl, updateApiBaseUrl, checkHealth, isDemoMode, setDemoMode } =
    useBanking();
  const [activeTab, setActiveTab] = useState<'connection' | 'api-contract' | 'code-files' | 'postman'>('connection');
  const [activeCodeFile, setActiveCodeFile] = useState<'pom' | 'yml' | 'sql' | 'security' | 'controller'>('pom');
  const [testUrl, setTestUrl] = useState(apiBaseUrl);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestAndSaveUrl = async () => {
    setIsTesting(true);
    await updateApiBaseUrl(testUrl);
    setIsTesting(false);
  };

  const handleDownloadPostman = () => {
    const jsonStr = generatePostmanCollection();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fincore_spring_boot_postman_collection.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                FinCore Indian Banking — Java 21 Spring Boot &amp; MySQL Hub
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Authoritative Backend
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Spring Boot REST endpoints, IMPS/NEFT/RTGS transaction logic, MySQL DDL schema &amp; Postman v2.1 collection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-800 bg-slate-900/50 overflow-x-auto">
          {[
            { id: 'connection', label: '1. Backend Connectivity & Health', icon: RefreshCw },
            { id: 'api-contract', label: '2. REST API Contract', icon: Layers },
            { id: 'code-files', label: '3. Spring Boot Code & MySQL DDL', icon: Code2 },
            { id: 'postman', label: '4. Postman Collection Export', icon: Download },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-emerald-400 text-emerald-300 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-300">
          {/* TAB 1: CONNECTION & HEALTH */}
          {activeTab === 'connection' && (
            <div className="space-y-6">
              {/* Status Box */}
              <div
                className={`p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  backendHealth.connected
                    ? 'bg-emerald-950/30 border-emerald-800/40'
                    : 'bg-amber-950/30 border-amber-800/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
                      backendHealth.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {backendHealth.connected
                        ? 'Spring Boot Service Reachable & Verified'
                        : 'Spring Boot Service Offline / Standby'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {backendHealth.connected
                        ? `Connected to ${backendHealth.url} with ${backendHealth.latencyMs}ms response time.`
                        : `No responsive Spring Boot server detected at ${backendHealth.url}. FinCore is currently running in Demo Preview Mode.`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {backendHealth.connected && (
                    <button
                      onClick={() => setDemoMode(false)}
                      className="px-3 py-1.5 text-xs font-medium text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors"
                    >
                      Use Live Backend
                    </button>
                  )}
                  <button
                    onClick={() => setDemoMode(!isDemoMode)}
                    className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
                  >
                    {isDemoMode ? 'Toggle Live Mode' : 'Toggle Demo Mode'}
                  </button>
                </div>
              </div>

              {/* Endpoint Configurator */}
              <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 space-y-3">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Target Spring Boot API Base URL (VITE_API_BASE_URL)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={testUrl}
                    onChange={(e) => setTestUrl(e.target.value)}
                    placeholder="http://localhost:8080/api/v1"
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleTestAndSaveUrl}
                    disabled={isTesting}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>Test &amp; Apply URL</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Tip: When developing locally in VS Code or IntelliJ IDEA, start your Spring Boot server on port 8080.
                  Ensure <code className="text-emerald-400">@CrossOrigin</code> or WebMvcConfigurer permits requests from this frontend.
                </p>
              </div>

              {/* Quick Architecture Spec */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-lg">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-2">
                    <Server className="w-4 h-4" />
                    <span>Application Layer</span>
                  </div>
                  <ul className="text-xs text-slate-400 space-y-1">
                    <li>· Java 21 LTS</li>
                    <li>· Spring Boot 3.3.x</li>
                    <li>· Spring MVC &amp; REST</li>
                    <li>· Spring Validation (JSR-380)</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-2">
                    <Database className="w-4 h-4" />
                    <span>Persistence Layer</span>
                  </div>
                  <ul className="text-xs text-slate-400 space-y-1">
                    <li>· MySQL 8.0+ Engine (InnoDB)</li>
                    <li>· Spring Data JPA / Hibernate 6</li>
                    <li>· Atomic Transactions (@Transactional)</li>
                    <li>· Decimal(15,2) Currencies</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-lg">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-2">
                    <Shield className="w-4 h-4" />
                    <span>Security &amp; API</span>
                  </div>
                  <ul className="text-xs text-slate-400 space-y-1">
                    <li>· Spring Security 6 (Stateless)</li>
                    <li>· JJWT Token Authentication</li>
                    <li>· BCrypt Password Hashing</li>
                    <li>· Idempotency Key validation</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REST API CONTRACT */}
          {activeTab === 'api-contract' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                FinCore interacts with the Spring Boot backend via standardized RESTful JSON endpoints.
                Authorization header format: <code className="text-emerald-400">Authorization: Bearer &lt;jwt_token&gt;</code>
              </div>

              <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
                {[
                  {
                    method: 'POST',
                    path: '/api/v1/auth/login',
                    desc: 'Authenticate user credentials and obtain Bearer JWT token',
                    auth: 'Public',
                    body: '{ "username": "alex.vance", "password": "password123" }',
                    response: '200 OK: { "token": "...", "tokenType": "Bearer", "expiresIn": 86400, "user": {...} }',
                  },
                  {
                    method: 'POST',
                    path: '/api/v1/auth/register',
                    desc: 'Register a new banking customer with initial credentials',
                    auth: 'Public',
                    body: '{ "username": "...", "email": "...", "fullName": "...", "password": "...", "phone": "..." }',
                    response: '201 Created: { "token": "...", "user": {...} }',
                  },
                  {
                    method: 'GET',
                    path: '/api/v1/accounts',
                    desc: 'Fetch all checking, savings, and commercial accounts for authenticated user',
                    auth: 'Bearer JWT',
                    body: 'None',
                    response: '200 OK: [ { "id": "acc_chk_001", "accountNumber": "440188921004", "balance": 24850.75, "availableBalance": 24350.75, ... } ]',
                  },
                  {
                    method: 'POST',
                    path: '/api/v1/accounts',
                    desc: 'Open a new bank account with currency and initial deposit',
                    auth: 'Bearer JWT',
                    body: '{ "accountType": "SAVINGS", "currency": "USD", "initialDeposit": 5000.00, "nickname": "Reserve" }',
                    response: '201 Created: Account object',
                  },
                  {
                    method: 'PATCH',
                    path: '/api/v1/accounts/{id}/status',
                    desc: 'Freeze or unfreeze an account for security containment',
                    auth: 'Bearer JWT',
                    body: '{ "status": "FROZEN" } or { "status": "ACTIVE" }',
                    response: '200 OK: Updated Account object',
                  },
                  {
                    method: 'POST',
                    path: '/api/v1/transfers',
                    desc: 'Execute atomic funds transfer with balance check and idempotency protection',
                    auth: 'Bearer JWT',
                    body: '{ "sourceAccountId": "acc_chk_001", "destinationAccountNumber": "992018442190", "beneficiaryName": "Elena Rostova", "amount": 250.00, "idempotencyKey": "idem_1742..." }',
                    response: '201 Created: { "transactionReference": "FC-TX-...", "status": "COMPLETED", "sourceAvailableBalance": 24100.75 }',
                  },
                  {
                    method: 'GET',
                    path: '/api/v1/transactions',
                    desc: 'Query transaction history with pagination, status, and type filtering',
                    auth: 'Bearer JWT',
                    body: 'Query Params: ?accountId=...&type=TRANSFER&status=COMPLETED&page=0&size=20',
                    response: '200 OK: Array of Transaction records',
                  },
                  {
                    method: 'GET',
                    path: '/api/v1/accounts/{id}/statement',
                    desc: 'Generate official periodic account statement with opening/closing balances',
                    auth: 'Bearer JWT',
                    body: 'Query Params: ?startDate=2026-09-01&endDate=2026-10-15',
                    response: '200 OK: { "account": {...}, "openingBalance": ..., "closingBalance": ..., "transactions": [...] }',
                  },
                  {
                    method: 'GET',
                    path: '/api/v1/health',
                    desc: 'Heartbeat status probe for frontend connectivity checks',
                    auth: 'Public',
                    body: 'None',
                    response: '200 OK: { "status": "UP", "timestamp": "...", "database": "CONNECTED" }',
                  },
                ].map((ep, idx) => (
                  <div key={idx} className="p-3.5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded ${
                            ep.method === 'POST'
                              ? 'bg-blue-900/60 text-blue-300 border border-blue-700/50'
                              : ep.method === 'GET'
                              ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                              : 'bg-amber-900/60 text-amber-300 border border-amber-700/50'
                          }`}
                        >
                          {ep.method}
                        </span>
                        <code className="text-xs font-mono font-semibold text-white">{ep.path}</code>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">Auth: {ep.auth}</span>
                    </div>

                    <p className="text-xs text-slate-300">{ep.desc}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="bg-slate-900 p-2 rounded border border-slate-800 text-slate-300">
                        <span className="text-slate-500 block mb-0.5 text-[10px]">PAYLOAD:</span>
                        <div className="truncate">{ep.body}</div>
                      </div>
                      <div className="bg-slate-900 p-2 rounded border border-slate-800 text-emerald-400/90">
                        <span className="text-slate-500 block mb-0.5 text-[10px]">RESPONSE:</span>
                        <div className="truncate">{ep.response}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CODE FILES & MYSQL DDL */}
          {activeTab === 'code-files' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {[
                    { id: 'pom', label: 'pom.xml (Maven)' },
                    { id: 'yml', label: 'application.yml' },
                    { id: 'sql', label: 'schema.sql (MySQL 8)' },
                    { id: 'security', label: 'SecurityConfig.java' },
                    { id: 'controller', label: 'TransferController.java' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setActiveCodeFile(f.id as typeof activeCodeFile)}
                      className={`px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${
                        activeCodeFile === f.id
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-medium'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const codeMap = {
                      pom: SPRING_BOOT_POM_XML,
                      yml: APPLICATION_YML,
                      sql: MYSQL_SCHEMA_SQL,
                      security: SPRING_SECURITY_CONFIG,
                      controller: SPRING_TRANSFER_CONTROLLER,
                    };
                    handleCopy(codeMap[activeCodeFile], activeCodeFile);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors shrink-0"
                >
                  {copiedKey === activeCodeFile ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code viewer container */}
              <div className="bg-slate-950 rounded-lg border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-[380px] leading-relaxed">
                <pre>
                  {activeCodeFile === 'pom' && SPRING_BOOT_POM_XML}
                  {activeCodeFile === 'yml' && APPLICATION_YML}
                  {activeCodeFile === 'sql' && MYSQL_SCHEMA_SQL}
                  {activeCodeFile === 'security' && SPRING_SECURITY_CONFIG}
                  {activeCodeFile === 'controller' && SPRING_TRANSFER_CONTROLLER}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: POSTMAN COLLECTION */}
          {activeTab === 'postman' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-orange-950/40 via-slate-900 to-slate-900 border border-orange-800/40 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                    FinCore Postman v2.1 Test Suite
                  </h3>
                  <p className="text-xs text-slate-400">
                    Includes automated tests, collection variables for JWT auth token injection, and all banking endpoints.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => handleCopy(generatePostmanCollection(), 'postman_json')}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors"
                  >
                    {copiedKey === 'postman_json' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied JSON</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownloadPostman}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .postman_collection.json</span>
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  How to test in Postman:
                </h4>
                <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                  <li>Open Postman &gt; Click <strong>Import</strong> &gt; Select the downloaded JSON file.</li>
                  <li>Ensure the collection variable <code className="text-emerald-400">baseUrl</code> points to <code className="text-slate-200">http://localhost:8080/api/v1</code>.</li>
                  <li>Execute the <strong>2. Authentication / Login</strong> request. A Postman Test script will automatically extract the Bearer token and store it in <code className="text-emerald-400">authToken</code>.</li>
                  <li>Execute <strong>3. Accounts</strong> or <strong>4. Fund Transfers</strong>; the token is passed automatically in the header!</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/70 text-xs">
          <div className="text-slate-500">
            Authoritative Java 21 Spring Boot + MySQL Architecture
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
          >
            Close Hub
          </button>
        </div>
      </div>
    </div>
  );
};
