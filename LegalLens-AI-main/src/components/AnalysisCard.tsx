import { motion } from 'framer-motion';
import { DollarSign, Building2, Scale, Shield, ChevronDown, ChevronUp, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface AnalysisCategory {
  id: string;
  title: string;
  subtitle: string;
  riskLevel: 'low' | 'medium' | 'high';
  points: string[];
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  money: DollarSign,
  data: Building2,
  legal: Scale,
  privacy: Shield,
};

const RISK_COLORS: Record<string, { badge: string; dot: string; border: string }> = {
  low: {
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    dot: 'bg-emerald-400',
    border: 'border-emerald-500/20',
  },
  medium: {
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    dot: 'bg-amber-400',
    border: 'border-amber-500/20',
  },
  high: {
    badge: 'bg-red-500/10 text-red-400 border-red-500/20',
    dot: 'bg-red-400',
    border: 'border-red-500/20',
  },
};

const RISK_ICONS: Record<string, React.ElementType> = {
  low: CheckCircle,
  medium: AlertCircle,
  high: AlertTriangle,
};

interface Props {
  category: AnalysisCategory;
  index: number;
}

export default function AnalysisCard({ category, index }: Props) {
  const [expanded, setExpanded] = useState(true);
  const Icon = CATEGORY_ICONS[category.id] ?? Shield;
  const risk = RISK_COLORS[category.riskLevel];
  const RiskIcon = RISK_ICONS[category.riskLevel];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm overflow-hidden"
    >
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/4 transition-colors"
      >
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <Icon size={16} className="text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white leading-tight">{category.title}</div>
          <div className="text-xs text-gray-500 mt-0.5 truncate">{category.subtitle}</div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${risk.badge}`}>
          <RiskIcon size={11} />
          <span className="capitalize">{category.riskLevel}</span>
        </div>
        <div className="flex-shrink-0 ml-1 text-gray-600">
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>

      <motion.div
        initial={false}
        animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
      >
        <div className="px-4 pb-4 space-y-2">
          <div className={`h-px bg-white/6`} />
          <ul className="space-y-2 mt-2">
            {category.points.map((point, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.3 }}
                className="flex items-start gap-2.5 text-xs text-gray-400 leading-relaxed"
              >
                <div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${risk.dot}`} />
                {point}
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
}
