import { motion } from 'framer-motion';

interface Props {
  level: 'low' | 'medium' | 'high';
}

const CONFIG = {
  low: { label: 'Low Risk', color: '#10B981', width: '33%' },
  medium: { label: 'Moderate Risk', color: '#F59E0B', width: '66%' },
  high: { label: 'High Risk', color: '#EF4444', width: '100%' },
};

export default function RiskMeter({ level }: Props) {
  const cfg = CONFIG[level];
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium">Overall Risk Level</span>
        <span className="text-xs font-bold" style={{ color: cfg.color }}>
          {cfg.label}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: cfg.width }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full"
          style={{ background: cfg.color }}
        />
      </div>
    </div>
  );
}
