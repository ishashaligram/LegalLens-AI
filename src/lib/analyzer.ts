import { AnalysisResult } from '../types';

/**
 * Sends the scraped legal text to your local FastAPI backend.
 * Includes safety slicing to prevent payload errors.
 */
export async function analyzeDocument(
  text: string,
  title: string,
  url: string
): Promise<AnalysisResult> {
  const API_URL = 'http://127.0.0.1:8000/analyze';

  // Security & Stability: Limit text to ~40k characters (plenty for AI)
  const sanitizedText = text.slice(0, 40000);

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      text: sanitizedText, 
      title: title || 'Untitled Page', 
      url: url || '' 
    }),
  });

  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Logic: Ensure the result matches our "High-End" interface
  return data as AnalysisResult;
}

/**
 * Fallback Mock: Used for demos or if your backend is offline.
 * Updated to use 'YES'/'NO' strings for better UI rendering.
 */
export function getMockAnalysis(title: string, url: string): AnalysisResult {
  return {
    summary:
      'This document contains several clauses that could impact your rights and privacy. Key concerns include mandatory arbitration, broad data sharing permissions, and auto-renewal billing practices.',
    overallRisk: 'high',
    documentTitle: title,
    documentUrl: url,
    analyzedAt: new Date().toISOString(),
    categories: [
      {
        id: 'money',
        title: 'Money & Billing',
        subtitle: 'Auto-renewals, refunds & charges',
        riskLevel: 'high',
        points: [
          'Subscription auto-renews without explicit notice 7 days prior',
          'Refunds are at sole discretion of the company',
          'Price changes can be made with 30-day notice',
        ],
      },
      {
        id: 'data',
        title: 'Organization & Data',
        subtitle: 'IP rights & data ownership',
        riskLevel: 'medium',
        points: [
          'Company may use your content to train AI models',
          'Data is retained for up to 3 years after deletion',
        ],
      },
      {
        id: 'legal',
        title: 'Legal & Governance',
        subtitle: 'Arbitration & jurisdiction',
        riskLevel: 'high',
        points: [
          'Mandatory binding arbitration — class actions are waived',
          'Disputes governed by Delaware law',
        ],
      },
      {
        id: 'privacy',
        title: 'Privacy & Safety',
        subtitle: 'Tracking & third-party sharing',
        riskLevel: 'medium',
        points: [
          'Tracks behavior across third-party websites via cookies',
          'No clear mechanism to opt out of data sharing',
        ],
      },
    ],
    quickChecks: [
      {
        id: 'password',
        question: 'Will they use my password for other services?',
        answer: 'NO',
        risk: 'low',
      },
      {
        id: 'sell',
        question: 'Will my personal details be sold?',
        answer: 'YES',
        risk: 'high',
      },
      {
        id: 'delete',
        question: 'Can I delete my data permanently?',
        answer: 'NO',
        risk: 'high',
      },
      {
        id: 'arbitration',
        question: 'Is there mandatory arbitration?',
        answer: 'YES',
        risk: 'high',
      },
    ],
  };
}
