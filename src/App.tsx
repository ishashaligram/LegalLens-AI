/// <reference types="chrome"/>
/* global chrome */
declare const chrome: any;
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
 
  import { 
  ScanSearch, 
  RefreshCcw,    // Change RefreshCw to RefreshCcw
  ExternalLink, 
  AlertTriangle, 
  Loader2, 
  Wifi, 
  WifiOff,
  ShieldCheck,
  Layers,
  FileText
} from 'lucide-react';
import AnalysisCard from './components/AnalysisCard';
import QuickCheck from './components/QuickCheck';
import RiskMeter from './components/RiskMeter';
import { analyzeDocument } from './lib/analyzer';
import type { AnalysisResult, PendingAnalysis } from './types';

type Status = 'idle' | 'scanning' | 'analyzing' | 'done' | 'error';
type Mode = 'individual' | 'batch';

export default function App() {
  const [mode, setMode] = useState<Mode>('individual');
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [batchUrls, setBatchUrls] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAnalysis | null>(null);
  
  const [usedMock, setUsedMock] = useState(false);

  // --- EXISTING INDIVIDUAL LOGIC ---
  const loadPending = useCallback(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['pendingAnalysis'], (data: { pendingAnalysis?: PendingAnalysis }) => {
        if (data.pendingAnalysis) {
          setPending(data.pendingAnalysis);
        }
      });
    }
  }, []);

  useEffect(() => {
    loadPending();
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.pendingAnalysis?.newValue) {
        setPending(changes.pendingAnalysis.newValue as PendingAnalysis);
      }
    };
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener(listener);
      return () => chrome.storage.onChanged.removeListener(listener);
    }
  }, [loadPending]);

  const runAnalysis = useCallback(async (pa: PendingAnalysis) => {
    setStatus('analyzing');
    setError(null);
    try {
      const res = await analyzeDocument(pa.text, pa.title, pa.url);
      setResult(res);
      setStatus('done');
    } catch (e) {
      const mock = getMockAnalysis(pa.title, pa.url);
      setResult(mock);
      setStatus('done');
      setUsedMock(true);
    }
  }, []);

  useEffect(() => {
    if (pending && status === 'idle' && mode === 'individual') {
      runAnalysis(pending);
    }
  }, [pending, status, runAnalysis, mode]);

  const handleScan = useCallback(() => {
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      setError("Extension environment not detected.");
      setStatus('error');
      return;
    }
    setStatus('scanning');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
      const tab = tabs[0];
      if (!tab?.id) { setStatus('error'); return; }
      chrome.scripting.executeScript(
        { target: { tabId: tab.id }, func: () => document.body.innerText },
        (results: any[]) => {
          const text = results?.[0]?.result ?? '';
          const pa: PendingAnalysis = {
            text: text.slice(0, 50000),
            title: tab.title ?? 'Untitled',
            url: tab.url ?? '',
          };
          setPending(pa);
          runAnalysis(pa);
        }
      );
    });
  }, [runAnalysis]);

  // --- NEW BATCH LOGIC (Scrapebox) ---
  const handleBatchScan = async () => {
    const urls = batchUrls.split('\n').filter(u => u.trim() !== "");
    if (urls.length === 0) {
      setError("Please enter at least one URL.");
      return;
    }

    setStatus('analyzing');
    chrome.runtime.sendMessage({ type: "START_BATCH_SCAN", urls }, (response: any) => {
      if (response && response.report) {
        // Assume API returns a structured AnalysisResult for the batch
        setResult(response.report);
        setStatus('done');
      } else {
        setError("Batch analysis failed. Ensure your backend is running.");
        setStatus('error');
      }
    });
  };

  const handleReset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
    setPending(null);
    setUsedMock(false);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.remove(['pendingAnalysis']);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col selection:bg-blue-500/30">
      <header className="sticky top-0 z-50 px-4 py-4 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <ShieldCheck size={20} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">LegalLens</h1>
              <p className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">Guardian AI</p>
            </div>
          </div>
          
          <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
            <button 
              onClick={() => {setMode('individual'); handleReset();}}
              className={`p-1.5 rounded-md transition-all ${mode === 'individual' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
            >
              <FileText size={14} />
            </button>
            <button 
              onClick={() => {setMode('batch'); handleReset();}}
              className={`p-1.5 rounded-md transition-all ${mode === 'batch' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
            >
              <Layers size={14} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {status === 'idle' && mode === 'individual' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
              <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-8">
                <ScanSearch size={36} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-bold mb-3">Scan Terms of Service</h2>
              <p className="text-sm text-gray-500 mb-8">Identify risks in the current tab instantly.</p>
              <button onClick={handleScan} className="w-full py-4 bg-blue-600 rounded-2xl font-bold shadow-xl shadow-blue-600/20">
                Start AI Analysis
              </button>
            </motion.div>
          )}

          {status === 'idle' && mode === 'batch' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 flex flex-col min-h-[60vh]">
              <h2 className="text-xl font-bold mb-2">Scrapebox Sector Audit</h2>
              <p className="text-xs text-gray-500 mb-6 font-medium">Batch harvest and compare multiple banking/crypto policies.</p>
              
              <textarea 
                className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-blue-500/50 outline-none transition-all mb-4"
                placeholder="Enter URLs (one per line)...&#10;hdfcbank.com/terms&#10;binance.com/legal"
                value={batchUrls}
                onChange={(e) => setBatchUrls(e.target.value)}
              />
              
              <button 
                onClick={handleBatchScan}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl font-bold shadow-lg shadow-blue-600/10 active:scale-[0.98] transition-all"
              >
                Run Scrapebox Batch Audit
              </button>
            </motion.div>
          )}

          {(status === 'scanning' || status === 'analyzing') && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[60vh]">
              <Loader2 size={40} className="text-blue-500 animate-spin mb-6" />
              <p className="text-sm font-medium text-gray-400 animate-pulse">
                {status === 'scanning' ? 'Reading document...' : 'LLM System is harvesting & auditing...'}
              </p>
            </motion.div>
          )}

          {status === 'done' && result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 space-y-4 pb-12">
               <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-md">
                <div className="flex justify-between items-start mb-4">
                  <div className="max-w-[70%]">
                    <h3 className="font-bold text-lg truncate mb-1">{result.documentTitle}</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                      <ExternalLink size={10} />
                      <span className="truncate max-w-[150px]">{result.documentUrl}</span>
                    </div>
                  </div>
                  <RiskMeter level={result.overallRisk} />
                </div>
                <p className="text-xs leading-relaxed text-gray-400 bg-black/20 p-3 rounded-xl border border-white/5">
                  {result.summary}
                </p>
              </div>

              <div className="grid gap-3">
                {result.categories.map((cat, i) => (
                  <AnalysisCard key={cat.id} category={cat} index={i} />
                ))}
              </div>
              <QuickCheck checks={result.quickChecks} />
              <button onClick={handleReset} className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
                Analyze New Sector
              </button>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
              <AlertTriangle size={36} className="text-red-400 mb-6" />
              <h2 className="text-xl font-bold mb-3">Analysis Failed</h2>
              <p className="text-sm text-gray-500 mb-8">{error || 'Unexpected error occurred.'}</p>
              <button onClick={handleReset} className="w-full py-4 bg-red-600 rounded-2xl font-bold">Try Again</button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function getMockAnalysis(title: string, url: string): AnalysisResult {
  const now = new Date().toISOString();
  return {
    documentTitle: title || 'Untitled Document',
    documentUrl: url || 'Unknown URL',
    summary: 'A fallback analysis was generated due to temporary backend issues. Review the highlighted risk categories for potential compliance and policy concerns.',
    overallRisk: 'medium',
    analyzedAt: now,
    categories: [
      {
        id: 'privacy-01',
        title: 'Privacy & Data Use',
        subtitle: 'Potentially excessive data collection and sharing',
        riskLevel: 'medium',
        points: [
          'The document may collect more user data than is strictly necessary.',
          'Data sharing with third parties could be broad and unspecified.',
          'Consider checking retention and consent language closely.',
        ],
      },
      {
        id: 'security-01',
        title: 'Security Practices',
        subtitle: 'Standard controls appear present but should be verified',
        riskLevel: 'low',
        points: [
          'Basic security statements are included.',
          'No explicit mention of strong encryption or incident response.',
        ],
      },
      {
        id: 'compliance-01',
        title: 'User Rights & Compliance',
        subtitle: 'User rights language may be incomplete',
        riskLevel: 'high',
        points: [
          'Right to access, deletion, or portability may be unclear.',
          'Missing specific references to regional privacy laws.',
        ],
      },
    ],
    quickChecks: [
      {
        id: 'qc-01',
        question: 'Does the policy clearly explain how data is shared with third parties?',
        answer: 'NO',
        risk: 'high',
      },
      {
        id: 'qc-02',
        question: 'Is user consent described for data collection and processing?',
        answer: 'NO',
        risk: 'medium',
      },
      {
        id: 'qc-03',
        question: 'Are security practices and incident management included?',
        answer: 'YES',
        risk: 'low',
      },
    ],
  };
}
