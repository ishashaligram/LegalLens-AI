import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import type { QuickCheck as QuickCheckType } from '../types';

interface Props {
  checks: QuickCheckType[];
}

export default function QuickCheck({ checks }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm overflow-hidden"
    >
      <div className="flex items-center gap-3 p-4 border-b border-white/6">
        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
          <HelpCircle size={16} className="text-blue-400" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Quick-Check</div>
          <div className="text-xs text-gray-500 mt-0.5">Critical questions answered</div>
        </div>
      </div>
      <div className="p-3 space-y-2">
        {checks.map((check, i) => (
          <motion.div
            key={check.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.08, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-start gap-3 p-3 rounded-xl bg-white/3 border border-white/6 hover:bg-white/5 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-300 leading-relaxed">{check.question}</p>
              {check.explanation && (
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{check.explanation}</p>
              )}
            </div>
            <div className="flex-shrink-0 mt-0.5">
              {check.answer === null ? (
                <span className="text-xs font-bold text-gray-500 px-2.5 py-1 rounded-lg bg-gray-500/10 border border-gray-500/20">
                  N/A
                </span>
              ) : check.answer ? (
                <span className="text-xs font-bold text-red-400 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/25 tracking-wide">
                  YES
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 tracking-wide">
                  NO
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
