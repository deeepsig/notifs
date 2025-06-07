let hasFired = false;
let pollIntervalId: number | undefined;
let isPolling = false;
let currentUrl = '';
let lastObservedUrl = '';

/**
 * Play notification sound - with sound preference check
 */
function playNotificationSound(): void {
  // First check if sound is enabled in user preferences
  chrome.storage.local.get(['soundEnabled'], (result) => {
    const isSoundEnabled = result.soundEnabled !== false; // Default to true if not set
    
    if (!isSoundEnabled) {
      console.log('Sound is disabled in preferences, skipping notification sound');
      return;
    }
    
    try {
      console.log('Attempting to play notification sound...');
      
      // Updated path to match your actual file location
      const soundUrl = chrome.runtime.getURL('dist/sounds/dustBunnies.mp3');
      console.log('Sound URL:', soundUrl);
      
      const audio = new Audio(soundUrl);
      audio.volume = 0.8;
      audio.preload = 'auto';
      
      // Add more comprehensive error handling
      audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        console.error('Error details:', {
          error: (e as any).error,
          type: e.type,
          target: e.target,
          networkState: audio.networkState,
          readyState: audio.readyState
        });
        
        // Try fallback - browser notification sound (only if sound is enabled)
        console.log('Attempting fallback notification...');
        try {
          new Notification('Claude Response Ready', {
            body: 'Your response is complete.',
            icon: chrome.runtime.getURL('dist/popup/notifs-logo.png'),
            silent: false
          });
        } catch (notifError) {
          console.error('Notification fallback failed:', notifError);
        }
      });
      
      audio.addEventListener('canplay', () => {
        console.log('Audio can play, attempting to start...');
      });
      
      audio.addEventListener('loadeddata', () => {
        console.log('Audio data loaded successfully');
      });
      
      // Simple play with better error handling
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Audio played successfully');
          })
          .catch((error) => {
            console.error('Audio play failed:', error);
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            
            // Try alternative approach - create a simple beep (only if sound is enabled)
            try {
              // TypeScript-safe AudioContext creation
              const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
              if (AudioContextClass) {
                const audioContext = new AudioContextClass();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 800; // Frequency in Hz
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
                
                console.log('Played fallback beep sound');
              } else {
                console.log('AudioContext not available');
              }
            } catch (beepError) {
              console.error('Fallback beep also failed:', beepError);
            }
          });
      }
      
    } catch (error) {
      console.error('Error in playNotificationSound:', error);
    }
  });
}

/**
 * Handle messages from background script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'play-sound') {
    console.log('Received play-sound message');
    playNotificationSound();
  }
});

/**
 * Detect if AI response generation is complete
 */
function checkForCompletion(): void {
  const isComplete = isClaudeComplete();
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
 * Check if Claude response is complete
 */
function isClaudeComplete(): boolean {
  // Look for "Retry" button which appears when response is complete
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
  
  // Additional check: look for streaming indicators
  const streamingIndicator = document.querySelector('[data-testid="streaming-indicator"]') ||
                           document.querySelector('.animate-pulse') ||
                           document.querySelector('[aria-label="Claude is responding"]');
  
  if (retryButton && !stopButton && !streamingIndicator) {
    console.log('Claude completion detected: Retry button found, no stop button, no streaming');
    return true;
  }
  
  return false;
}

/**
 * Reset state and start monitoring for a new chat
 */
function startNewChatMonitoring(): void {
  console.log('Starting new chat monitoring');
  
  // Reset state flags
  hasFired = false;
  isPolling = true;
  
  // Send in-progress message
  chrome.runtime.sendMessage({
    type: "chat-in-progress",
    url: window.location.href,
  });
  
  // Clear any existing polling
  if (pollIntervalId !== undefined) {
    clearInterval(pollIntervalId);
  }
  
  // Add a small delay before starting to poll to let the UI update
  setTimeout(() => {
    // Start polling for completion
    pollIntervalId = window.setInterval(checkForCompletion, 500);
  }, 100);
}

/**
 * Handle Enter key press in text areas
 */
function handleEnterKeyPress(event: KeyboardEvent): void {
  // Check if Enter was pressed (without Shift for new line)
  if (event.key === 'Enter' && !event.shiftKey) {
    const target = event.target as HTMLElement;
    
    // Check if we're in a textarea or contenteditable element that's likely the chat input
    if (target.tagName === 'TEXTAREA' || 
        target.getAttribute('contenteditable') === 'true' ||
        target.getAttribute('role') === 'textbox') {
      
      console.log('Enter key pressed in chat input');
      
      // Start monitoring immediately - don't wait for confirmation
      setTimeout(() => {
        startNewChatMonitoring();
      }, 100);
    }
  }
}

/**
 * Find and observe the send button for Claude
 */
function observeSendButton(): void {
  let sendButton: HTMLElement | null = null;
  // Claude selectors
  sendButton = document.querySelector('[data-testid="send-button"]') ||
               document.querySelector('button[type="submit"]') ||
               Array.from(document.querySelectorAll("button")).find(
                 (btn) => btn.getAttribute('aria-label')?.includes('Send') ||
                         btn.textContent?.includes('Send')
               ) || null;

  if (sendButton) {
    console.log('Found send button:', sendButton);
    
    // Remove any existing listener to avoid duplicates
    sendButton.removeEventListener("click", handleSendButtonClick);
    sendButton.addEventListener("click", handleSendButtonClick);
  } else {
    console.log('Send button not found, will retry...');
  }
}

/**
 * Handle send button click
 */
function handleSendButtonClick(): void {
  console.log('Send button clicked');
  // Start monitoring immediately
  setTimeout(() => {
    startNewChatMonitoring();
  }, 100);
}

/**
 * Set up keyboard event listeners
 */
function setupKeyboardListeners(): void {
  // Remove existing listener to avoid duplicates
  document.removeEventListener('keydown', handleEnterKeyPress, true);
  // Add listener with capture=true to catch it before other handlers
  document.addEventListener('keydown', handleEnterKeyPress, true);
}

/**
 * Check if we're on a new conversation/URL
 */
function checkUrlChange(): void {
  const newUrl = window.location.href;
  if (newUrl !== lastObservedUrl) {
    console.log('URL changed from', lastObservedUrl, 'to', newUrl);
    lastObservedUrl = newUrl;
    
    // Reset state when URL changes (new conversation)
    if (pollIntervalId !== undefined) {
      clearInterval(pollIntervalId);
      pollIntervalId = undefined;
    }
    hasFired = false;
    isPolling = false;
    
    // Reinitialize everything
    setTimeout(() => {
      initialize();
    }, 500);
  }
}

/**
 * Initialize the content script
 */
function initialize(): void {
  console.log('Content script initializing on:', window.location.href);
  
  // Update current URL tracking
  currentUrl = window.location.href;
  lastObservedUrl = currentUrl;
  
  // Set up keyboard listeners
  setupKeyboardListeners();
  
  // Try to find send button immediately
  observeSendButton();
  
  // Auto-detect if we should start monitoring based on page state
  setTimeout(() => {
    checkInitialState();
  }, 1000);
  
  // Set up a MutationObserver to watch for DOM changes
  const observer = new MutationObserver((mutations) => {
    let shouldRecheck = false;
    let shouldCheckState = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if any new buttons were added
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.tagName === 'BUTTON' || element.querySelector('button')) {
              shouldRecheck = true;
            }
            // Check if streaming content was added
            if (element.textContent || element.querySelector('[data-testid]')) {
              shouldCheckState = true;
            }
          }
        });
      }
    });
    
    if (shouldRecheck) {
      // Debounce the recheck
      setTimeout(() => {
        observeSendButton();
        setupKeyboardListeners();
      }, 100);
    }
    
    if (shouldCheckState) {
      // Check if we should start monitoring
      setTimeout(() => {
        checkInitialState();
      }, 100);
    }
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Check for URL changes periodically (for SPA navigation)
  setInterval(checkUrlChange, 1000);
}

/**
 * Check initial state and start monitoring if needed
 */
function checkInitialState(): void {
  // Don't start monitoring if we're already polling
  if (isPolling) {
    return;
  }
  
  // Check if Claude is currently generating a response
  const stopButton = document.querySelector('[aria-label="Stop generating"]') ||
                    Array.from(document.querySelectorAll("button")).find(
                      (btn) => btn.textContent?.includes("Stop") || 
                              btn.getAttribute('aria-label')?.includes('Stop')
                    );
  
  const streamingIndicator = document.querySelector('[data-testid="streaming-indicator"]') ||
                           document.querySelector('.animate-pulse') ||
                           document.querySelector('[aria-label="Claude is responding"]');
  
  // If we detect that Claude is currently responding, start monitoring
  if (stopButton || streamingIndicator) {
    console.log('Detected Claude is currently responding, starting monitoring');
    startNewChatMonitoring();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Also try to initialize after delays to catch dynamic content
setTimeout(initialize, 1000);
setTimeout(initialize, 3000);

// Handle visibility changes (tab switching)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    console.log('Tab became visible, reinitializing...');
    setTimeout(initialize, 100);
  }
});

// Handle page navigation (for SPA routing)
window.addEventListener('popstate', () => {
  console.log('Navigation detected, reinitializing...');
  setTimeout(initialize, 100);
});

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (pollIntervalId !== undefined) {
    clearInterval(pollIntervalId);
  }
  isPolling = false;
  document.removeEventListener('keydown', handleEnterKeyPress, true);
});