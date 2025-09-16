import asyncio
import os
from dotenv import load_dotenv
from browser_use import Agent
from langchain_google_genai import ChatGoogleGenerativeAI

print(os.getenv("GEMINI_API_KEY"))

load_dotenv()

prompt = """Perform comprehensive automated testing on https://practicetestautomation.com/practice-test-login/ including functional, security, and post-login UI interactions. Produce a structured test report with pass/fail for each step, screenshots for key states, and short remediation notes for any failures.

PHASE 1: POSITIVE FUNCTIONAL TESTS
1. Login with valid credentials
   - Username: student
   - Password: Password123
   - Actions:
     - Navigate to the login page.
     - Fill username and password and submit.
     - Wait for navigation or page update after submit.
   - Verify:
     - Successful redirect to the logged-in page (URL change or presence of logged-in UI).
     - "Logged In Successfully" message or equivalent visible.
   - Capture: screenshot of the post-login state.

PHASE 2: NEGATIVE FUNCTIONAL TESTS
2. Invalid username: username=invalid, password=Password123
   - Verify appropriate error message appears.
3. Invalid password: username=student, password=wrong
   - Verify appropriate error message appears.
4. Empty username: username=<empty>, password=Password123
   - Verify validation error appears.
5. Empty password: username=student, password=<empty>
   - Verify validation error appears.
6. Both fields empty
   - Verify validation errors appear.

PHASE 3: SECURITY TESTS
7. SQL injection attempt in username (e.g., "' OR '1'='1';--")
   - Verify the system does not authenticate and returns a safe error (no DB errors leaked).
8. XSS attempt in username (e.g., "<script>alert(1)</script>")
   - Verify input is sanitized, no script executes, and no reflected XSS occurs.

PHASE 4: POST-LOGIN NAVIGATION & UI INTERACTIONS
(Only perform this after a successful login from Phase 1)

A. Navigate to the Practice page
   - From the logged-in UI, click the link or menu item labeled "Practice" (or navigate to the practice page URL).
   - Verify arrival on the practice page (URL or page title).

B. Click on "Test Exceptions" and open that page
   - Locate and click the "Test Exceptions" link/button on the practice page.
   - Wait for the page to load and verify expected header or content present.
   - Capture: screenshot of the Test Exceptions page.

C. In the "Create list of your favorite foods" section:
   - Press the "Add" button.
   - Wait for the new input field to appear (use an explicit wait up to a reasonable timeout, e.g., 10s).
   - Type `burger` into the field.
   - Press the "Save" button.
   - Verify that "burger" appears in the saved list (element text, list item present).
   - Capture: screenshot after save.

D. Remove the item:
   - Press the "Remove" button for the `burger` item.
   - Verify the item no longer exists in the list.
   - Capture: screenshot after removal.

E. Navigate to the Contact page
   - Click the "Contact" link or navigate to the contact page URL.
   - Verify arrival on the Contact page.

F. Fill the contact form:
   - First name: `Test`
   - Last name: `Me`
   - Email: `test@gmail.com`
   - Comment/message: `testing`
   - Actions:
     - Fill each field.
     - If there is a visible checkbox labeled "I am not a robot" (a simple UI checkbox), select it.
     - If a real CAPTCHA / reCAPTCHA is present ("I'm not a robot" challenge), **do not attempt to bypass**: report its presence, capture a screenshot, and record that manual intervention or test-mode bypass is required.
     - Submit the form.
   - Verify:
     - Submission success message or confirmation page appears, OR
     - If CAPTCHA blocked submission, record exact behavior and screenshot.

PHASE 5: GENERAL & REPORTING
- For every step: wait for elements to be interactable before clicking/typing; use explicit waits (up to 10s) for dynamic content.
- For every failure: capture an HTML snippet or response, plus a screenshot.
- Produce a final structured test report containing:
  - Step name, expected vs actual, pass/fail, evidence (screenshot filenames or base64), timing for each step
  - Any errors, exceptions, or stack traces encountered
  - Note if CAPTCHA prevented automation and whether a test/staging bypass is needed

NOTES:
- Do not attempt to circumvent real CAPTCHAs. If automation is blocked by CAPTCHA, report it and stop further automated submission steps that require solving it.
- Use realistic pacing (short think time) between actions so the site can respond.
- If CSRF tokens or dynamic tokens are required for form POSTs, fetch them from the GET response and include them in the POST.
"""


async def main():
    agent = Agent(
        task=prompt,
        llm=ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            temperature=0.0,
            google_api_key=os.getenv("GEMINI_API_KEY")
        ),

    )
    await agent.run()

if __name__ == "__main__":
    asyncio.run(main())