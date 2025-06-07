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
interface PlaySoundMessage {
  type: "play-sound";
}
type ExtensionMessage =
  | ChatInProgressMessage
  | ChatCompleteMessage
  | GetStatusMessage
  | PlaySoundMessage;

export interface StatusData {
  trackedTabId: number | null;
  status: "idle" | "in-progress" | "done";
  trackedUrl: string;
  tabTitle?: string; // Add optional tab title field
}

/**
 * 2. In-Memory State (mirrored to storage)
 * ----------------------------------------
 */
let trackedTabId: number | null = null;
let currentStatus: StatusData["status"] = "idle";
let trackedUrl: string = "";
let tabTitle: string = "";

/**
 * 3. Helper: Get and store tab title
 * ----------------------------------
 */
function updateTabTitle(tabId: number): void {
  if (tabId) {
    chrome.tabs.get(tabId, (tab) => {
      if (tab && tab.title) {
        tabTitle = tab.title;
        console.log('Updated tab title:', tabTitle);
        persistStatus();
      }
    });
  }
}

/**
 * 4. Helper: Persist status in chrome.storage
 * --------------------------------------------
 */
function persistStatus(): void {
  const payload: StatusData = {
    trackedTabId,
    status: currentStatus,
    trackedUrl,
    tabTitle: tabTitle || undefined,
  };
  console.log('Persisting status:', payload);
  chrome.storage.local.set(payload);
}

/**
 * 5. Helper: Get service name from URL
 * ------------------------------------
 */
function getServiceName(url: string): string {
  if (url.includes('claude.ai')) return 'Claude';
  if (url.includes('chat.openai.com')) return 'ChatGPT';
  return 'AI Chat';
}

/**
 * 6. Helper: Play notification sound
 * ----------------------------------
 */
function playNotificationSound(): void {
  if (trackedTabId !== null) {
    // Send message to content script to play sound
    chrome.tabs.sendMessage(trackedTabId, { type: "play-sound" }).catch((error) => {
      console.log('Could not send play-sound message to content script:', error);
    });
  }
}

/**
 * 7. Load persisted state on startup
 * ----------------------------------
 */
chrome.storage.local.get(['trackedTabId', 'status', 'trackedUrl', 'tabTitle'], (items) => {
  trackedTabId = items.trackedTabId ?? null;
  currentStatus = items.status ?? 'idle';
  trackedUrl = items.trackedUrl ?? '';
  tabTitle = items.tabTitle ?? '';
  console.log('Loaded persisted state:', { trackedTabId, currentStatus, trackedUrl, tabTitle });
});

/**
 * 8. Incoming Message Handler
 * ----------------------------
 */
chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: StatusData) => void
  ) => {
    console.log('Received message:', message, 'from sender:', sender);
    
    // 8.1 "User clicked Send/Submit" → in-progress
    if (message.type === "chat-in-progress" && sender.tab?.id !== undefined) {
      console.log('Setting status to in-progress');
      
      // Always update to the new tab - this handles tab switching
      trackedTabId = sender.tab.id;
      currentStatus = "in-progress";
      trackedUrl = message.url;
      
      // Get and store the actual tab title
      updateTabTitle(sender.tab.id);
      
      // Clear any existing notifications when starting a new chat
      chrome.notifications.getAll((notifications) => {
        Object.keys(notifications).forEach((notificationId) => {
          chrome.notifications.clear(notificationId);
        });
      });
      
      return;
    }
    
    // 8.2 "AI finished streaming" → chat-complete
    if (message.type === "chat-complete" && sender.tab?.id !== undefined) {
      console.log('Chat complete detected');
      
      // Update if it's the same tab we were tracking OR if it's a Claude tab
      // (to handle cases where tab switching happened)
      const isClaudeTab = message.url.includes('claude.ai');
      if (trackedTabId === null || sender.tab.id === trackedTabId || isClaudeTab) {
        trackedTabId = sender.tab.id;
        currentStatus = "done";
        trackedUrl = message.url;
        
        const serviceName = getServiceName(message.url);
        
        // Play notification sound
        playNotificationSound();
        
        // Wait for tab title to update, then show notification
        const checkAndShowNotification = () => {
          if (sender.tab?.id === undefined) return;
          
          chrome.tabs.get(sender.tab.id, (tab) => {
            if (tab.title && tab.title !== 'Claude' && !tab.title.includes('New chat')) {
              // We have a proper conversation title
              tabTitle = tab.title;
              persistStatus();
              
              // Fire a native desktop notification
              chrome.notifications.create({
                type: "basic",
                iconUrl: chrome.runtime.getURL("dist/popup/notifs-logo.png"),
                title: tab.title,
                message: `Click here to read the response.`,
                priority: 2
              });
              console.log('Notification sent for completed chat with title:', tab.title);
            } else {
              // Tab title not ready yet, wait a bit and try again
              setTimeout(checkAndShowNotification, 500);
            }
          });
        };
        
        checkAndShowNotification();
      }
      return;
    }
    
    // 8.3 Popup asks "get-status" → return stored StatusData
    if (message.type === "get-status") {
      chrome.storage.local.get(
        ["trackedTabId", "status", "trackedUrl", "tabTitle"],
        (items) => {
          const responsePayload: StatusData = {
            trackedTabId: items.trackedTabId ?? null,
            status: items.status ?? "idle",
            trackedUrl: items.trackedUrl ?? "",
            tabTitle: items.tabTitle ?? undefined,
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
 * 9. Handle tab activation (user switches tabs)
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
        
        // Update tab title
        if (tab.title) {
          tabTitle = tab.title;
        }
        
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
 * 10. Handle tab updates (URL changes within a tab AND title changes)
 * -------------------------------------------------------------------
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Handle URL changes to Claude
  if (changeInfo.url && changeInfo.url.includes('claude.ai')) {
    console.log('Claude tab URL changed:', changeInfo.url);
    
    // If this is our tracked tab or we should start tracking it
    if (tabId === trackedTabId || trackedTabId === null) {
      trackedTabId = tabId;
      trackedUrl = changeInfo.url;
      
      // Update title if available
      if (tab.title) {
        tabTitle = tab.title;
      }
      
      // Reset to idle when navigating to a new conversation
      currentStatus = 'idle';
      persistStatus();
    }
  }
  
  // Handle title changes for our tracked tab
  if (changeInfo.title && tabId === trackedTabId) {
    console.log('Tracked tab title changed:', changeInfo.title);
    tabTitle = changeInfo.title;
    persistStatus();
  }
});

/**
 * 11. If the tracked tab closes, reset to idle
 * --------------------------------------------
 */
chrome.tabs.onRemoved.addListener((closedTabId) => {
  console.log('Tab closed:', closedTabId);
  if (closedTabId === trackedTabId) {
    console.log('Tracked tab was closed, resetting status');
    trackedTabId = null;
    currentStatus = "idle";
    trackedUrl = "";
    tabTitle = "";
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
 * 12. Handle notification clicks - open the chat tab
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
 * 13. Debug: Log when extension starts
 * ------------------------------------
 */
console.log('Extension background script loaded');