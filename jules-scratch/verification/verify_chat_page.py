
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto("http://localhost:3000")

        # Wait for 5 seconds
        await page.wait_for_timeout(5000)

        # Take a screenshot before the click
        await page.screenshot(path="jules-scratch/verification/before_click.png")

        # Click the "Sign In" button to open the modal
        await page.locator('button:has-text("Sign In")').first.click()

        # Fill in the email and password
        await page.get_by_label("Email").fill("JulesTest@test.com")
        await page.get_by_label("Password").fill("JulesTest")

        # Click the "Sign In" button in the modal
        await page.locator(".cl-modal-content").get_by_role("button", name="Sign In").click()

        # Wait for the page to load
        await page.wait_for_timeout(5000)

        # Take a screenshot of the chat page
        await page.screenshot(path="jules-scratch/verification/chat_page.png")

        await browser.close()

asyncio.run(main())
