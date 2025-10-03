from playwright.sync_api import sync_playwright, Page, expect
import time
import re

def verify_persistent_chat(page: Page):
    """
    This script verifies that the chat is persistent across page loads.
    It waits for the input to be enabled and uses robust locators.
    """
    print("Navigating to the chat page...")
    page.goto("http://localhost:3000/chat", wait_until="networkidle")

    chat_input = page.get_by_placeholder("Send a message...")
    print("Waiting for chat input to be enabled...")
    expect(chat_input).to_be_enabled(timeout=30000)
    print("Chat page loaded and ready.")

    message_text = f"Hello, this is a test message for persistence at {time.time()}."
    print(f"Sending message: '{message_text}'")
    chat_input.fill(message_text)

    send_button = page.locator('button:has(svg.lucide-send)')
    expect(send_button).to_be_enabled()
    send_button.click()

    print("Verifying the sent message appears in the chat...")
    expect(page.get_by_text(message_text)).to_be_visible(timeout=20000)
    print("User message appeared.")

    print("Verifying an AI response appears...")
    model_response_locator = page.locator("div.group.flex:has(svg.lucide-bot)")
    expect(model_response_locator.first).to_be_visible(timeout=30000)
    print("AI response appeared.")

    # The title is the first 40 chars of the message + '...'
    expected_title = message_text[:40] + '...'
    print(f"Waiting for new chat with title '{expected_title}' to appear in the sidebar...")
    new_chat_in_sidebar = page.get_by_role("link", name=expected_title)
    expect(new_chat_in_sidebar).to_be_visible(timeout=20000)
    print("New chat appeared in sidebar.")

    # Click the new chat to navigate and ensure we are on the correct page before reload
    new_chat_in_sidebar.click()
    expect(page).to_have_url(re.compile(r"/chat/.+"), timeout=15000)
    print(f"Navigated to new chat URL: {page.url}")

    print("Taking screenshot before reload...")
    page.screenshot(path="jules-scratch/verification/chat_before_reload.png")

    print("Reloading the page...")
    page.reload(wait_until="networkidle")

    print("Waiting for chat input to be enabled after reload...")
    expect(chat_input).to_be_enabled(timeout=30000)

    print("Verifying the message is still present after reload...")
    expect(page.get_by_text(message_text)).to_be_visible(timeout=20000)
    expect(model_response_locator.first).to_be_visible(timeout=20000)
    print("Chat history successfully persisted.")

    print("Taking final screenshot...")
    page.screenshot(path="jules-scratch/verification/verification.png")
    print("Verification script finished successfully.")


def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_persistent_chat(page)
        finally:
            browser.close()

if __name__ == "__main__":
    run_verification()