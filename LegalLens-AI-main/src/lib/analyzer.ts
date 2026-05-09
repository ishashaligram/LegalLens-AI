import type { AnalysisResult } from "../types";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";

export async function analyzeDocument(
  text: string,
  title: string,
  url: string
): Promise<AnalysisResult> {
  const response = await fetch(
    `${API_URL}/analyze-single`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        title,
        url,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error(err);
    throw new Error("Backend failed");
  }

  return await response.json();
}

export function getMockAnalysis(
  title: string,
  url: string
): AnalysisResult {
  return {
    documentTitle: title,
    documentUrl: url,
    overallRisk: "Medium",
    summary:
      "This document contains arbitration and data-sharing clauses.",

    analyzedAt: new Date().toISOString(),

    categories: [
      {
        id: "1",
        title: "Data Privacy",
        risk: "High",
        description:
          "This site may share user data with third parties.",
      },
    ],

    quickChecks: [
      {
        label: "Arbitration Clause",
        passed: false,
      },
      {
        label: "Data Selling",
        passed: false,
      },
    ],
  };
}