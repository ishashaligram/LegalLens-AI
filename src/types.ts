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
  // Changed from boolean to string literals to match your analyzer logic
  answer: 'YES' | 'NO' | null; 
  explanation?: string;
  // Added risk to match the objects in your analyzer.ts
  risk?: 'low' | 'high'; 
}

export interface AnalysisResult {
  summary: string;
  overallRisk: 'low' | 'medium' | 'high';
  categories: AnalysisCategory[];
  quickChecks: QuickCheck[];
  analyzedAt: string;
  documentTitle: string;
  documentUrl: string;
}

export interface PendingAnalysis {
  text: string;
  title: string;
  url: string;
}
