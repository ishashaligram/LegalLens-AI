chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'OPEN_SIDE_PANEL' && sender.tab?.id) {
    chrome.sidePanel.open({ tabId: sender.tab.id });
  }

  if (message.type === 'PAGE_TEXT') {
    chrome.storage.local.set({
      pendingAnalysis: message.payload,
      analysisStatus: 'pending',
    });
  }
});
