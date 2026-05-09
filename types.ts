export interface AnalysisCategory {
  id: string;
  title: string;
  subtitle: string;
  riskLevel: 'low' | 'medium' | 'high';
  points: string[];
}

export interface QuickCheck {
  id: string;
  question: string;
  answer: 'YES' | 'NO';
  risk: 'low' | 'medium' | 'high';
}

export interface AnalysisResult {
  summary: string;
  overallRisk: 'low' | 'medium' | 'high';
  categories: AnalysisCategory[];
  quickChecks: QuickCheck[];
  analyzedAt: string;
  documentTitle: string; // This is likely what was throwing the error
  documentUrl: string;
}

export interface PendingAnalysis {
  text: string;
  title: string;
  url: string;
}