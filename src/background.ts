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
      trackedTabId = sender.tab.id;
      currentStatus = "in-progress";
      trackedUrl = message.url;
      persistStatus();
      return;
    }

    // 6.2 "AI finished streaming" → chat-complete
    if (message.type === "chat-complete" && sender.tab?.id !== undefined) {
      console.log('Chat complete detected');
      
      // Only update if it's the same tab we were tracking (or if nothing tracked yet)
      if (trackedTabId === null || sender.tab.id === trackedTabId) {
        trackedTabId = sender.tab.id;
        currentStatus = "done";
        trackedUrl = message.url;
        persistStatus();

        const serviceName = getServiceName(message.url);
        
        // Fire a native desktop notification
        chrome.notifications.create({
          type: "basic",
          iconUrl: chrome.runtime.getURL("dist/popup/totoro-done.png"),
          title: `${serviceName} Response Ready! 🎉`,
          message: "Claude response is complete and ready to read.",
          priority: 2
        });

        // Optional: Play a sound (if you want audio notification)
        // This would require adding an audio file to your extension
        
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
 * 7. If the tracked tab closes, reset to idle
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
  }
});

/**
 * 8. Handle notification clicks - open the chat tab
 * --------------------------------------------------
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
 * 9. Debug: Log when extension starts
 * ------------------------------------
 */
console.log('Extension background script loaded');