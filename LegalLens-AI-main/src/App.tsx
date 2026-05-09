
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanSearch,
  RefreshCw,
  ExternalLink,
  Loader2,
  Wifi,
  WifiOff,
  ShieldCheck,
} from "lucide-react";

import AnalysisCard from "./components/AnalysisCard";
import QuickCheck from "./components/QuickCheck";
import RiskMeter from "./components/RiskMeter";

import { analyzeDocument, getMockAnalysis } from "./lib/analyzer";

import type { AnalysisResult, PendingAnalysis } from "./types";

type Status = "idle" | "scanning" | "analyzing" | "done" | "error";

export default function App() {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAnalysis | null>(null);
  const [usedMock, setUsedMock] = useState(false);

  const loadPending = useCallback(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["pendingAnalysis"], (data) => {
        if (data.pendingAnalysis) {
          setPending(data.pendingAnalysis);
        }
      });
    }
  }, []);

  useEffect(() => {
    loadPending();

    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange }
    ) => {
      if (changes.pendingAnalysis?.newValue) {
        setPending(changes.pendingAnalysis.newValue);
      }
    };

    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.onChanged.addListener(listener);

      return () => {
        chrome.storage.onChanged.removeListener(listener);
      };
    }
  }, [loadPending]);

  const runAnalysis = useCallback(async (pa: PendingAnalysis) => {
    setStatus("analyzing");
    setError(null);
    setUsedMock(false);

    try {
      const res = await analyzeDocument(pa.text, pa.title, pa.url);

      setResult(res);
      setStatus("done");
    } catch (e) {
  console.error("Analysis failed:", e);

  setResult({
    documentTitle: pa.title,
    documentUrl: pa.url,
    overallRisk: "Medium",

    summary: "Website scanned successfully.",

    analyzedAt: new Date().toISOString(),

    categories: [
      {
        id: "1",
        title: "Terms Analysis",
        risk: "Medium",

        description:
          pa.text.slice(0, 300) ||
          "Content detected.",
      },
    ],

    quickChecks: [
      {
        label: "Content Detected",
        passed: pa.text.length > 100,
      },
    ],
  });

  setUsedMock(true);
  setStatus("done");
}
  }, []);

  useEffect(() => {
    if (pending && status === "idle") {
      runAnalysis(pending);
    }
  }, [pending, status, runAnalysis]);

  const handleScan = useCallback(() => {
    if (
      typeof chrome === "undefined" ||
      !chrome.tabs ||
      !chrome.scripting
    ) {
      setError("Chrome extension APIs unavailable.");
      setStatus("error");
      return;
    }

    setStatus("scanning");

    chrome.tabs.query(
      { active: true, currentWindow: true },
      (tabs) => {
        const tab = tabs[0];

        if (!tab?.id) {
          setError("No active tab found.");
          setStatus("error");
          return;
        }

        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            func: () => ({
              text: Array.from(
  document.querySelectorAll("p, li, h1, h2, h3")
)
  .map((el) => el.textContent || "")
  .join(" ")
  .replace(/\s+/g, " ")
  .trim(),
              url: window.location.href,
              title: document.title,
            }),
          },
          (results) => {
            const res = results?.[0]?.result;

            if (!res) {
              setError("Failed to read page.");
              setStatus("error");
              return;
            }

            const pa: PendingAnalysis = {
              text: res.text.slice(0, 50000),
              title: res.title || "Untitled",
              url: res.url || "",
            };

            chrome.storage.local.set({
              pendingAnalysis: pa,
            });

            setPending(pa);

            runAnalysis(pa);
          }
        );
      }
    );
  }, [runAnalysis]);

  const handleReset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
    setPending(null);
    setUsedMock(false);

    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.remove(["pendingAnalysis"]);
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-blue-400" />
          <h1 className="font-bold text-lg">LegalLens</h1>
        </div>

        {result && (
          <button onClick={handleReset}>
            <RefreshCw size={18} />
          </button>
        )}
      </header>

      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <button
              onClick={handleScan}
              className="bg-blue-600 px-4 py-3 rounded-xl font-semibold"
            >
              Start AI Analysis
            </button>
          </motion.div>
        )}

        {(status === "scanning" || status === "analyzing") && (
          <div className="flex flex-col items-center mt-20">
            <Loader2 className="animate-spin mb-4" />

            <p>
              {status === "scanning"
                ? "Reading page..."
                : "Analyzing document..."}
            </p>
          </div>
        )}

        {status === "done" && result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="bg-white/5 p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-lg">
                    {result.documentTitle}
                  </h2>

                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <ExternalLink size={12} />
                    <span>{result.documentUrl}</span>
                  </div>
                </div>

                <RiskMeter level={result.overallRisk} />
              </div>

              <p className="text-sm text-gray-300">
                {result.summary}
              </p>
            </div>

            <div className="bg-white/10 p-4 rounded-xl">
  <h2 className="text-lg font-bold mb-2">
    Scan Result
  </h2>

  <p className="text-sm text-gray-300 mb-3">
    {result.summary}
  </p>

  <div className="text-xs text-gray-400 break-words">
    {result.documentUrl}
  </div>
</div>

            <div className="text-xs text-gray-500 text-center">
              {usedMock ? (
                <div className="flex items-center justify-center gap-1">
                  <WifiOff size={12} />
                  Offline Mode
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1">
                  <Wifi size={12} />
                  AI Live
                </div>
              )}
            </div>
          </motion.div>
        )}

        {status === "error" && (
          <div className="text-red-400 text-sm">
            {error}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}