export interface Category {
  id?: string;
  title: string;
  risk: string;
  description: string;
}

export interface QuickCheckItem {
  label: string;
  passed: boolean;
}

export interface AnalysisResult {
  documentTitle: string;
  documentUrl: string;
  overallRisk: string;
  summary: string;
  analyzedAt: string;
  categories: Category[];
  quickChecks: QuickCheckItem[];
}

export interface PendingAnalysis {
  text: string;
  title: string;
  url: string;
}