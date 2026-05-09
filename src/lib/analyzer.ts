import { AnalysisResult } from '../types';

export async function analyzeDocument(text: string, url: string, title: string): Promise<AnalysisResult> {
  const response = await fetch('http://localhost:8000/analyze-single', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) throw new Error('Analysis Failed');

  const data = await response.json();

  // Mapping the backend response to your frontend Interface
  return {
    summary: data.summary || "No summary provided.",
    overallRisk: data.overall_risk || 'medium',
    categories: data.categories || [],
    quickChecks: data.quick_checks || [],
    analyzedAt: new Date().toISOString(),
    documentTitle: title || "Untitled Document", // This fixes the title error
    documentUrl: url
  };
}