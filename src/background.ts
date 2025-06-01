// notifs/src/background.ts

/**
 * 1. Interfaces & Types
 * ----------------------
 *   • ChatInProgressMessage: sent when a Send/Submit event occurs
 *   • ChatCompleteMessage: sent when we detect that the AI has finished streaming
 *   • GetStatusMessage: sent by the popup to ask “what’s current status?”
 *
 *   • StatusData: shape of what we persist in chrome.storage.local
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
 * 3. Helper: Persist “trackedTabId / currentStatus / trackedUrl” in chrome.storage
 * --------------------------------------------------------------------------------
 */
function persistStatus(): void {
  const payload: StatusData = {
    trackedTabId,
    status: currentStatus,
    trackedUrl,
  };
  chrome.storage.local.set(payload);
}

/**
 * 4. Incoming Message Handler
 * ----------------------------
 */
chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: StatusData) => void
  ) => {
    // 4.1 “User clicked Send/Submit” → in-progress
    if (message.type === "chat-in-progress" && sender.tab?.id !== undefined) {
      trackedTabId = sender.tab.id;
      currentStatus = "in-progress";
      trackedUrl = message.url;
      persistStatus();
      return; // no response needed
    }

    // 4.2 “AI finished streaming” → chat-complete
    if (message.type === "chat-complete" && sender.tab?.id !== undefined) {
      // Only update if it’s the same tab we were tracking (or if nothing tracked yet)
      if (trackedTabId === null || sender.tab.id === trackedTabId) {
        trackedTabId = sender.tab.id;
        currentStatus = "done";
        trackedUrl = message.url;
        persistStatus();

        // Fire a native desktop notification
        chrome.notifications.create({
          type: "basic",
          iconUrl: "/totoro-done.png",
          title: "Chat Complete!",
          message: "Your AI response is ready.",
        });
      }
      return;
    }

    // 4.3 Popup asks “get-status” → return stored StatusData
    if (message.type === "get-status") {
      chrome.storage.local.get(
        ["trackedTabId", "status", "trackedUrl"],
        (items) => {
          const responsePayload: StatusData = {
            trackedTabId: items.trackedTabId ?? null,
            status: items.status ?? "idle",
            trackedUrl: items.trackedUrl ?? "",
          };
          sendResponse(responsePayload);
        }
      );
      // Indicate we’ll sendResponse asynchronously
      return true;
    }
  }
);

/**
 * 5. If the tracked tab closes, reset to idle
 * --------------------------------------------
 */
chrome.tabs.onRemoved.addListener((closedTabId) => {
  if (closedTabId === trackedTabId) {
    trackedTabId = null;
    currentStatus = "idle";
    trackedUrl = "";
    chrome.storage.local.clear();
  }
});
