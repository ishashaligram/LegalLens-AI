// Look for where the button click happens
chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
        // This ensures we get the text of the page the user is actually on
        const pageText = document.body.innerText;
        const pageUrl = window.location.href;
        const pageTitle = document.title;

        return {
            text: pageText.substring(0, 10000), // Grabs a clean chunk of text
            url: pageUrl,
            title: pageTitle
        };
    }
}, (results) => {
    const data = results[0].result;
    // When you send this to your Python backend, 
    // make sure you are passing data.text AND data.url
    analyzeWithGemini(data.text, data.url); 
});
// This function ensures you grab the ACTUAL text of the current page
func: () => {
    // 1. Identify the main content area (ignores common headers/footers)
    const content = document.querySelector('main') || document.body;
    
    // 2. Return unique identifiers so the AI knows which site this is
    return {
        text: content.innerText.substring(0, 10000), // Get the first 10k characters
        url: window.location.href,                   // Crucial for uniqueness
        domain: window.location.hostname             // Helps the AI "know" the brand
    };
}