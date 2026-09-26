import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda err: print(f"ERROR: {err}"))
        
        await page.goto("http://localhost:5173/")
        await page.wait_for_timeout(2000)
        print("Page title:", await page.title())
        await browser.close()

asyncio.run(main())
