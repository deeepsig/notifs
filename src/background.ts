// notifs/src/background.ts

/**
 * 1. Interfaces & Types
 * ----------------------
 */

interface ChatInProgressMessage {
  type: "chat-in-progress";
  url: string;
}

interface ChatCompleteMessage {
  type: "chat-complete";
  url: string;
}

interface GetStatusMessage {
  type: "get-status";
}

type ExtensionMessage =
  | ChatInProgressMessage
  | ChatCompleteMessage
  | GetStatusMessage;

export interface StatusData {
  trackedTabId: number | null;
  status: "idle" | "in-progress" | "done";
  trackedUrl: string;
}

/**
 * 2. In-Memory State (mirrored to storage)
 * ----------------------------------------
 */
let trackedTabId: number | null = null;
let currentStatus: StatusData["status"] = "idle";
let trackedUrl: string = "";

/**
 * 3. Helper: Persist status in chrome.storage
 * --------------------------------------------
 */
function persistStatus(): void {
  const payload: StatusData = {
    trackedTabId,
    status: currentStatus,
    trackedUrl,
  };
  console.log('Persisting status:', payload);
  chrome.storage.local.set(payload);
}

/**
 * 4. Helper: Get service name from URL
 * ------------------------------------
 */
function getServiceName(url: string): string {
  if (url.includes('claude.ai')) return 'Claude';
  if (url.includes('chat.openai.com')) return 'ChatGPT';
  return 'AI Chat';
}

/**
 * 5. Load persisted state on startup
 * ----------------------------------
 */
chrome.storage.local.get(['trackedTabId', 'status', 'trackedUrl'], (items) => {
  trackedTabId = items.trackedTabId ?? null;
  currentStatus = items.status ?? 'idle';
  trackedUrl = items.trackedUrl ?? '';
  console.log('Loaded persisted state:', { trackedTabId, currentStatus, trackedUrl });
});

/**
 * 6. Incoming Message Handler
 * ----------------------------
 */
chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: StatusData) => void
  ) => {
    console.log('Received message:', message, 'from sender:', sender);

    // 6.1 "User clicked Send/Submit" → in-progress
    if (message.type === "chat-in-progress" && sender.tab?.id !== undefined) {
      console.log('Setting status to in-progress');
      
      // Always update to the new tab - this handles tab switching
      trackedTabId = sender.tab.id;
      currentStatus = "in-progress";
      trackedUrl = message.url;
      persistStatus();
      
      // Clear any existing notifications when starting a new chat
      chrome.notifications.getAll((notifications) => {
        Object.keys(notifications).forEach((notificationId) => {
          chrome.notifications.clear(notificationId);
        });
      });
      
      return;
    }

    // 6.2 "AI finished streaming" → chat-complete
    if (message.type === "chat-complete" && sender.tab?.id !== undefined) {
      console.log('Chat complete detected');
      
      // Update if it's the same tab we were tracking OR if it's a Claude tab
      // (to handle cases where tab switching happened)
      const isClaudeTab = message.url.includes('claude.ai');
      if (trackedTabId === null || sender.tab.id === trackedTabId || isClaudeTab) {
        trackedTabId = sender.tab.id;
        currentStatus = "done";
        trackedUrl = message.url;
        persistStatus();

        const serviceName = getServiceName(message.url);
        
        // Fire a native desktop notification
        chrome.notifications.create({
          type: "basic",
          iconUrl: chrome.runtime.getURL("dist/popup/notifs-logo.png"),
          title: `${serviceName} Response Complete`,
          message: `Click here to read the response.`,
          priority: 2
        });

        console.log('Notification sent for completed chat');
      }
      return;
    }

    // 6.3 Popup asks "get-status" → return stored StatusData
    if (message.type === "get-status") {
      chrome.storage.local.get(
        ["trackedTabId", "status", "trackedUrl"],
        (items) => {
          const responsePayload: StatusData = {
            trackedTabId: items.trackedTabId ?? null,
            status: items.status ?? "idle",
            trackedUrl: items.trackedUrl ?? "",
          };
          console.log('Sending status response:', responsePayload);
          sendResponse(responsePayload);
        }
      );
      // Indicate we'll sendResponse asynchronously
      return true;
    }
  }
);

/**
 * 7. Handle tab activation (user switches tabs)
 * ----------------------------------------------
 */
chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log('Tab activated:', activeInfo.tabId);
  
  // Get the URL of the newly activated tab
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url && tab.url.includes('claude.ai')) {
      console.log('Activated Claude tab, checking if we should track it');
      
      // If we don't have a tracked tab or the URL is different, 
      // update our tracking but keep status as idle until a new chat starts
      if (trackedTabId === null || trackedUrl !== tab.url) {
        trackedTabId = activeInfo.tabId;
        trackedUrl = tab.url;
        // Only reset to idle if we're switching to a different Claude conversation
        if (currentStatus === 'done' || currentStatus === 'in-progress') {
          currentStatus = 'idle';
        }
        persistStatus();
      }
    }
  });
});

/**
 * 8. Handle tab updates (URL changes within a tab)
 * ------------------------------------------------
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only care about URL changes to Claude
  if (changeInfo.url && changeInfo.url.includes('claude.ai')) {
    console.log('Claude tab URL changed:', changeInfo.url);
    
    // If this is our tracked tab or we should start tracking it
    if (tabId === trackedTabId || trackedTabId === null) {
      trackedTabId = tabId;
      trackedUrl = changeInfo.url;
      // Reset to idle when navigating to a new conversation
      currentStatus = 'idle';
      persistStatus();
    }
  }
});

/**
 * 9. If the tracked tab closes, reset to idle
 * --------------------------------------------
 */
chrome.tabs.onRemoved.addListener((closedTabId) => {
  console.log('Tab closed:', closedTabId);
  if (closedTabId === trackedTabId) {
    console.log('Tracked tab was closed, resetting status');
    trackedTabId = null;
    currentStatus = "idle";
    trackedUrl = "";
    chrome.storage.local.clear();
    
    // Clear any notifications when tab closes
    chrome.notifications.getAll((notifications) => {
      Object.keys(notifications).forEach((notificationId) => {
        chrome.notifications.clear(notificationId);
      });
    });
  }
});

/**
 * 10. Handle notification clicks - open the chat tab
 * ---------------------------------------------------
 */
chrome.notifications.onClicked.addListener((notificationId) => {
  console.log('Notification clicked:', notificationId);
  
  if (trackedTabId !== null) {
    // Switch to the chat tab
    chrome.tabs.update(trackedTabId, { active: true }, () => {
      // Focus the window containing this tab
      chrome.tabs.get(trackedTabId!, (tab) => {
        if (tab.windowId) {
          chrome.windows.update(tab.windowId, { focused: true });
        }
      });
    });
  }
  
  // Clear the notification
  chrome.notifications.clear(notificationId);
});

/**
 * 11. Debug: Log when extension starts
 * ------------------------------------
 */
console.log('Extension background script loaded');