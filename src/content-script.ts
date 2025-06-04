// notifs/src/content-script.ts
let hasFired = false;
let pollIntervalId: number | undefined;
let isPolling = false;
/**
 * Detect if AI response generation is complete
 */
function checkForCompletion(): void {
  const currentUrl = window.location.href;
  let isComplete = false;
  
  if (currentUrl.includes('claude.ai')) {
    // For Claude: Look for "Retry" button which appears when response is complete
    const retryButton = Array.from(document.querySelectorAll("button")).find(
      (btn) => {
        const buttonText = btn.textContent?.trim();
        return buttonText === "Retry" || 
               btn.getAttribute('aria-label')?.includes('Retry') ||
               btn.querySelector('[data-testid="retry-icon"]');
      }
    );
    
    // Also check that there's no "Stop generating" button
    const stopButton = document.querySelector('[aria-label="Stop generating"]') ||
                      Array.from(document.querySelectorAll("button")).find(
                        (btn) => btn.textContent?.includes("Stop") || 
                                btn.getAttribute('aria-label')?.includes('Stop')
                      );
    
    if (retryButton && !stopButton) {
      isComplete = true;
      console.log('Claude completion detected: Retry button found, no stop button');
    }
  } 
  else if (currentUrl.includes('chat.openai.com')) {
    // For ChatGPT: Look for Regenerate button
    const regenerateButton = Array.from(document.querySelectorAll("button")).find(
      (btn) => btn.textContent?.includes("Regenerate")
    );
    
    // Also check that there's no stop button
    const stopButton = Array.from(document.querySelectorAll("button")).find(
      (btn) => btn.textContent?.includes("Stop generating")
    );
    
    if (regenerateButton && !stopButton) {
      isComplete = true;
      console.log('ChatGPT completion detected: Regenerate button found');
    }
  }
  if (isComplete && !hasFired && isPolling) {
    console.log('Marking chat as complete');
    hasFired = true;
    isPolling = false;
    if (pollIntervalId !== undefined) {
      clearInterval(pollIntervalId);
      pollIntervalId = undefined;
    }
    
    chrome.runtime.sendMessage({
      type: "chat-complete",
      url: window.location.href,
    });
  }
}
/**
 * Find and observe the send button for both Claude and ChatGPT
 */
function observeSendButton(): void {
  const currentUrl = window.location.href;
  let sendButton: HTMLElement | null = null;
  if (currentUrl.includes('claude.ai')) {
    // Claude selectors
    sendButton = document.querySelector('[data-testid="send-button"]') ||
                 document.querySelector('button[type="submit"]') ||
                 Array.from(document.querySelectorAll("button")).find(
                   (btn) => btn.getAttribute('aria-label')?.includes('Send') ||
                           btn.textContent?.includes('Send')
                 ) || null;
  } 
  else if (currentUrl.includes('chat.openai.com')) {
    // ChatGPT selectors
    sendButton = document.querySelector('[data-testid="send-button"]') ||
                 Array.from(document.querySelectorAll("button")).find(
                   (btn) => btn.textContent?.includes("Send")
                 ) || null;
  }
  if (sendButton) {
    console.log('Found send button:', sendButton);
    
    sendButton.addEventListener("click", () => {
      console.log('Send button clicked');
      hasFired = false;
      isPolling = true;
      
      chrome.runtime.sendMessage({
        type: "chat-in-progress",
        url: window.location.href,
      });
      // Clear any existing polling
      if (pollIntervalId !== undefined) {
        clearInterval(pollIntervalId);
      }
      
      // Start polling for completion
      pollIntervalId = window.setInterval(checkForCompletion, 500);
    });
  } else {
    console.log('Send button not found, will retry...');
  }
}
/**
 * Initialize the content script
 */
function initialize(): void {
  console.log('Content script initializing on:', window.location.href);
  
  // Try to find send button immediately
  observeSendButton();
  
  // Set up a MutationObserver to watch for DOM changes
  const observer = new MutationObserver((mutations) => {
    let shouldRecheck = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if any new buttons were added
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.tagName === 'BUTTON' || element.querySelector('button')) {
              shouldRecheck = true;
            }
          }
        });
      }
    });
    
    if (shouldRecheck) {
      // Debounce the recheck
      setTimeout(observeSendButton, 100);
    }
  });
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}
// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
// Also try to initialize after a short delay to catch dynamic content
setTimeout(initialize, 1000);
setTimeout(initialize, 3000);
// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (pollIntervalId !== undefined) {
    clearInterval(pollIntervalId);
  }
  isPolling = false;
});