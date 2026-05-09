// Existing: Opens side panel on click or message
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Existing: Open panel from content script
  if (message.type === 'OPEN_SIDE_PANEL' && sender.tab?.id) {
    chrome.sidePanel.open({ tabId: sender.tab.id });
  }

  // Existing: Handle single-page text (Your original logic)
  if (message.type === 'PAGE_TEXT') {
    chrome.storage.local.set({
      pendingAnalysis: message.payload,
      analysisStatus: 'pending',
    });
  }

  // --- NEW: BATCH SCAN LOGIC (Scrapebox/LLM System) ---
  if (message.type === "START_BATCH_SCAN") {
    // We send the URL list to your FastAPI backend
    fetch('http://localhost:8000/analyze-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: message.urls })
    })
    .then(response => response.json())
    .then(data => {
      // Send the Job ID back to the React UI so it can start polling
      sendResponse(data); 
    })
    .catch(error => {
      console.error("Batch Scan Error:", error);
      sendResponse({ status: "error", error: error.message });
    });
    
    return true; // Keep the message channel open for the async fetch
  }
});