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
  risk_score?: number; // Added to match backend 0-100 score
  category: string; // Added to distinguish "Financial" vs "General"
  categories: AnalysisCategory[];
  quickChecks: QuickCheck[];
  analyzedAt: string;
  documentTitle: string; 
  documentUrl: string;
  comparison_text?: string; // Added for the comparison logic
}

export interface PendingAnalysis {
  text: string;
  title: string;
  url: string;
}