// notifs/src/content-script.ts

/**
 * 1. We’ll detect “chat‐in‐progress” when the user clicks a button labeled “Send” or “Submit.”
 * 2. Then we poll (every 800 ms) for any indication that the AI has finished streaming.
 *    In ChatGPT’s DOM, “Regenerate” appears once the response is done streaming, but 
 *    if the UI changes, you can swap this for any post‐stream indicator (e.g. spinner CSS class).
 */

let hasFired = false;
let pollIntervalId: number | undefined;

/**
 *  Detect “AI done” by looking for a post‐stream indicator.
 *  Update this selector if the website’s DOM changes.
 */
function checkForCompletion(): void {
  // Example: ChatGPT’s “Regenerate” button appears AFTER streaming completes.
  const doneIndicator = Array.from(
    document.querySelectorAll("button")
  ).some((btn) => btn.textContent === "Regenerate");

  if (doneIndicator && !hasFired) {
    hasFired = true;
    chrome.runtime.sendMessage({
      type: "chat-complete",
      url: window.location.href,
    });
  }
}

/**
 *  Listen for the “Send” or “Submit” button click to mark “in-progress.”
 */
function observeSendButton(): void {
  const sendBtn = Array.from(document.querySelectorAll("button")).find(
    (btn) => btn.textContent === "Send" || btn.textContent === "Submit"
  );

  if (sendBtn) {
    sendBtn.addEventListener("click", () => {
      hasFired = false;
      chrome.runtime.sendMessage({
        type: "chat-in-progress",
        url: window.location.href,
      });

      // Start (or restart) polling for completion
      if (pollIntervalId !== undefined) {
        clearInterval(pollIntervalId);
      }
      pollIntervalId = window.setInterval(checkForCompletion, 800);
    });
  }
}

// Immediately attempt to hook any existing Send/Submit button on page load:
observeSendButton();

// If the page is reloaded or navigated away, clear our interval
window.addEventListener("beforeunload", () => {
  if (pollIntervalId !== undefined) {
    clearInterval(pollIntervalId);
  }
});
