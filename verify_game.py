from playwright.sync_api import sync_playwright

def verify_game_load():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console messages
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda exc: console_errors.append(str(exc)))

        try:
            print("Navigating to game...")
            page.goto("http://localhost:8000")

            # Wait for canvas to be present
            print("Waiting for canvas...")
            page.wait_for_selector("canvas", timeout=5000)

            # Wait a bit for game loop to start and potential errors to appear
            page.wait_for_timeout(2000)

            if console_errors:
                print("Console Errors found:")
                for error in console_errors:
                    print(f"- {error}")
                raise Exception("Console errors detected")
            else:
                print("No console errors detected.")

            # Take screenshot
            print("Taking screenshot...")
            page.screenshot(path="verification.png")
            print("Screenshot saved to verification.png")

        except Exception as e:
            print(f"Verification failed: {e}")
            if console_errors:
                print("Console Errors:")
                for error in console_errors:
                    print(f"- {error}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_game_load()
