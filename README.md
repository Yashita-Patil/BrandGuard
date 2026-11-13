# BrandGuard

Pre-publication brand governance for Northwind. BrandGuard checks content against approved guidelines, facts, and assets; explains each finding; suggests fixes; and supports a role-based review workflow with analytics from submissions.

## Run locally

Requires **Node.js 18.18+** (Node.js 20 or 22 recommended).

```bash
cd brandguard
npm install
npm run dev
```

Open **http://127.0.0.1:3000** in your browser.

No separate backend or database setup is required for the local demo. Workspace and workflow state are stored in the browser using `localStorage`.

## Configure the OpenAI API key (optional)

The core compliance checks work without an API key. To enable live OpenAI-powered rewrite and override-coach responses:

1. In the `brandguard` project folder (the same folder that contains `package.json`), create a file named `.env.local`.
2. Add your API key:

   ```env
   OPENAI_API_KEY=your_actual_api_key_here
   ```

3. Save the file.
4. If the development server is running, stop it with `Ctrl + C` and start it again:

   ```bash
   npm run dev
   ```

The key is read on the server by the rewrite and override API routes. Keep it private:
- Do not add the key to React components or other client-side code.
- Do not use the `NEXT_PUBLIC_` prefix for this key.
- Do not commit `.env.local` or share it publicly. The project `.gitignore` ignores `.env*` files.
- For deployment, configure `OPENAI_API_KEY` in the hosting provider's environment-variable settings rather than uploading `.env.local`.

If `OPENAI_API_KEY` is not configured, the optional AI features use the built-in kit-grounded mock/fallback behaviour. Compliance findings continue to come from the deterministic rule engine.

## Roles

- **Asha Patel (Creator)** — draft content, run scans, apply safe fixes, and submit or resubmit work.
- **Meera Shah (Reviewer)** — review submissions and request changes with comments.
- **Ravi Menon (Manager)** — approve submissions, including a logged override justification when high-severity issues remain.

Role selection is provided for demonstration. It is not production authentication or secure access control.

## What is checked

BrandGuard checks:
- Terminology and preferred/avoided wording.
- Brand tone and content guidance.
- Unsupported claims and approved-fact mismatches.
- Accessibility, including image alt text, colour contrast, link text, and readability.
- Brand colour palette rules.

Each finding explains the issue and references its guideline. Fixes are suggestions and are not applied unless a user chooses to apply them.

## Review tools

- Grouped findings and reduced duplicate violations.
- Severity-based finding filters.
- Individual safe-fix actions and **Apply All Safe Fixes**.
- Original and revised content comparison.
- Finding dismissal and activity/history records.
- Publication risk information with Ship / Hold / Block guidance.

## Round 3 additions

1. **Review experience** — grouped violations, duplicate reduction, severity filters, Apply All Safe Fixes, and before/after comparison.
2. **Approval workflow** — change requests with comments, creator editing and resubmission, named reviewer/approver records, revision history, and a decision trail.
3. **Insights and analytics** — submission totals, approval rate, category-wise violations, frequently occurring issues, and recent review activity.

## Additional capabilities

- **Brand Kit management** — preferred terminology, words to avoid, approved facts, and brand guidance.
- **Accessibility checks** — checks for alt text, contrast, descriptive link text, and readability.
- **Image upload and preview** — supports adding visual assets to the content review workflow.
- **AI-assisted rewrite** — proposes brand-aligned content revisions when the OpenAI API key is configured; proposals require user review and are never auto-applied.
- **Override coach** — provides optional guidance for documenting an override; a justification is recorded when an override is used.
- **Activity and revision history** — records review actions, decisions, and content revisions.

## AI / external services

Compliance findings always come from the deterministic rule engine. Optional rewrite and override-coach features call OpenAI when `OPENAI_API_KEY` is set on the server; otherwise a kit-grounded mock rewriter/fallback is used. Proposals are never automatically applied.

Fonts are bundled via `next/font`.

## Data and demo limitations

- The demo stores application state in browser `localStorage`; it does not use a production database.
- The included roles demonstrate the workflow and do not provide real user authentication or production-grade permissions.
- Initial sample content and demonstration records may appear in the workspace and analytics. Analytics should be interpreted in the context of the data currently stored in the browser.
- Alt-text checks evaluate the available text metadata; they are not a full visual or computer-vision assessment of image content.
- Do not treat the demo as the only compliance or approval control for live publication.

## Useful commands

```bash
npm install       # Install project dependencies
npm run dev       # Start the local development server
npm run build     # Create a production build
npm run start     # Run the production build
```
