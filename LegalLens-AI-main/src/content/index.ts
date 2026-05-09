const TRIGGER_KEYWORDS = [
  'terms of service',
  'terms & conditions',
  'terms and conditions',
  'privacy policy',
  'license agreement',
  'sign up',
  'create account',
  'end user license',
  'user agreement',
];

const LOGO_ID = 'legallens-trigger-logo';
const BANNER_ID = 'legallens-detection-banner';

function detectLegalContent(): boolean {
  const text = document.body.innerText.toLowerCase();
  const title = document.title.toLowerCase();
  const combined = text + ' ' + title;
  return TRIGGER_KEYWORDS.some((kw) => combined.includes(kw));
}

function injectFloatingLogo() {
  if (document.getElementById(LOGO_ID)) return;

  const container = document.createElement('div');
  container.id = LOGO_ID;
  container.style.cssText = `
    position: fixed;
    bottom: 28px;
    right: 28px;
    z-index: 2147483647;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    animation: legallens-fadein 0.5s cubic-bezier(0.16,1,0.3,1) both;
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes legallens-fadein {
      from { opacity: 0; transform: translateY(20px) scale(0.85); }
      to   { opacity: 1; transform: translateY(0)   scale(1); }
    }
    @keyframes legallens-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.5); }
      50%       { box-shadow: 0 0 0 12px rgba(59,130,246,0); }
    }
    #legallens-trigger-logo:hover .ll-btn {
      transform: scale(1.08);
      background: rgba(255,255,255,0.18);
    }
  `;
  document.head.appendChild(style);

  const btn = document.createElement('div');
  btn.className = 'll-btn';
  btn.style.cssText = `
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: rgba(10,10,20,0.75);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.14);
    box-shadow: 0 8px 32px rgba(0,0,0,0.45), 0 0 0 0 rgba(59,130,246,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease, background 0.2s ease;
    animation: legallens-pulse 2.5s ease-in-out infinite;
  `;

  btn.innerHTML = `
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="13" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
      <path d="M8 10.5C8 9.67 8.67 9 9.5 9H18.5C19.33 9 20 9.67 20 10.5V17.5C20 18.33 19.33 19 18.5 19H9.5C8.67 19 8 18.33 8 17.5V10.5Z" stroke="#60A5FA" stroke-width="1.5" fill="none"/>
      <path d="M11 12.5H17M11 14.5H15M11 16.5H16" stroke="#60A5FA" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="20.5" cy="8.5" r="3" fill="#EF4444"/>
      <path d="M20.5 7.2V8.8M20.5 9.8V9.9" stroke="white" stroke-width="1.2" stroke-linecap="round"/>
    </svg>
  `;

  const label = document.createElement('div');
  label.style.cssText = `
    background: rgba(10,10,20,0.75);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 8px;
    padding: 4px 10px;
    color: #93C5FD;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
  `;
  label.textContent = 'LegalLens';

  container.appendChild(btn);
  container.appendChild(label);
  document.body.appendChild(container);

  container.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
    sendTextToBackground();
  });
}

function injectDetectionBanner() {
  if (document.getElementById(BANNER_ID)) return;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes ll-banner-in {
      from { opacity: 0; transform: translateY(-100%); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);

  const banner = document.createElement('div');
  banner.id = BANNER_ID;
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 2147483646;
    background: rgba(8,8,8,0.92);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255,255,255,0.08);
    padding: 10px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    animation: ll-banner-in 0.4s cubic-bezier(0.16,1,0.3,1) both;
    box-shadow: 0 4px 24px rgba(0,0,0,0.5);
  `;

  banner.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:8px;height:8px;border-radius:50%;background:#EF4444;box-shadow:0 0 8px #EF4444;flex-shrink:0;"></div>
      <span style="color:#E5E7EB;font-size:13px;font-weight:500;">
        <span style="color:#60A5FA;font-weight:700;">LegalLens</span> detected legal content on this page
      </span>
    </div>
    <div style="display:flex;align-items:center;gap:8px;">
      <button id="ll-analyze-btn" style="
        background: rgba(59,130,246,0.15);
        border: 1px solid rgba(59,130,246,0.4);
        color: #60A5FA;
        padding: 5px 14px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        transition: background 0.2s;
      ">Analyze Now</button>
      <button id="ll-dismiss-btn" style="
        background: transparent;
        border: 1px solid rgba(255,255,255,0.1);
        color: #6B7280;
        padding: 5px 12px;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        font-family: inherit;
      ">Dismiss</button>
    </div>
  `;

  document.body.appendChild(banner);

  document.getElementById('ll-analyze-btn')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
    sendTextToBackground();
    banner.remove();
  });

  document.getElementById('ll-dismiss-btn')?.addEventListener('click', () => {
    banner.remove();
  });

  setTimeout(() => {
    if (document.getElementById(BANNER_ID)) banner.remove();
  }, 8000);
}

function sendTextToBackground() {
  const text = document.body.innerText;
  const title = document.title;
  const url = window.location.href;
  chrome.runtime.sendMessage({
    type: 'PAGE_TEXT',
    payload: { text: text.slice(0, 50000), title, url },
  });
}

function init() {
  if (detectLegalContent()) {
    injectFloatingLogo();
    injectDetectionBanner();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
