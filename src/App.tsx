import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ScanSearch, 
  RefreshCw, 
  ExternalLink, 
  AlertTriangle, 
  Loader2, 
  Wifi, 
  WifiOff,
  ShieldCheck
} from 'lucide-react';
import AnalysisCard from './components/AnalysisCard';
import QuickCheck from './components/QuickCheck';
import RiskMeter from './components/RiskMeter';
import { analyzeDocument, getMockAnalysis } from './lib/analyzer';
import type { AnalysisResult, PendingAnalysis } from './types';

type Status = 'idle' | 'scanning' | 'analyzing' | 'done' | 'error';

export default function App() {
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAnalysis | null>(null);
  const [usedMock, setUsedMock] = useState(false);

  const loadPending = useCallback(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['pendingAnalysis'], (data) => {
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
        setPending(changes.pendingAnalysis.newValue);
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
    setUsedMock(false);
    try {
      const res = await analyzeDocument(pa.text, pa.title, pa.url);
      setResult(res);
      setStatus('done');
    } catch (e) {
      console.error("Analysis failed, falling back to mock:", e);
      const mock = getMockAnalysis(pa.title, pa.url);
      setResult(mock);
      setStatus('done');
      setUsedMock(true);
    }
  }, []);

  useEffect(() => {
    if (pending && status === 'idle') {
      runAnalysis(pending);
    }
  }, [pending, status, runAnalysis]);

  const handleScan = useCallback(() => {
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      setError("Extension environment not detected.");
      setStatus('error');
      return;
    }

    setStatus('scanning');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) {
        setStatus('error');
        setError('No active tab found.');
        return;
      }
      chrome.scripting.executeScript(
        { target: { tabId: tab.id }, func: () => document.body.innerText },
        (results) => {
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
      {/* Navbar */}
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
          
          <div className="flex items-center gap-2">
            {result && (
              <button 
                onClick={handleReset}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all active:scale-95"
              >
                <RefreshCw size={14} />
              </button>
            )}
            {status === 'done' && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                usedMock ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}>
                {usedMock ? <WifiOff size={10} /> : <Wifi size={10} />}
                <span>{usedMock ? 'Offline Mode' : 'AI Live'}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center"
            >
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                  <ScanSearch size={36} className="text-blue-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold mb-3">Scan Terms of Service</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-8">
                Instantly identify hidden risks, mandatory arbitration, and data privacy concerns.
              </p>
              <button 
                onClick={handleScan}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98]"
              >
                Start AI Analysis
              </button>
            </motion.div>
          )}

          {(status === 'scanning' || status === 'analyzing') && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <Loader2 size={40} className="text-blue-500 animate-spin mb-6" />
              <p className="text-sm font-medium text-gray-400 animate-pulse">
                {status === 'scanning' ? 'Reading document...' : 'AI is analyzing clauses...'}
              </p>
            </motion.div>
          )}

          {status === 'done' && result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="p-4 space-y-4 pb-12"
            >
              {/* Document Overview Card */}
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

              {/* Analysis Grid */}
              <div className="grid gap-3">
                {result.categories.map((cat, i) => (
                  <AnalysisCard key={cat.id} category={cat} index={i} />
                ))}
              </div>

              {/* Quick Check Section */}
              <QuickCheck checks={result.quickChecks} />

              <footer className="text-center pt-8 border-t border-white/5">
                <p className="text-[10px] text-gray-600 uppercase tracking-tighter">
                  Analysis Timestamp: {new Date(result.analyzedAt).toLocaleString()}
                </p>
              </footer>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}