# Junting Orbit Privacy Policy

_Last updated: November 20, 2025_

Junting Orbit is a Chrome extension that helps you research job postings, generate AI-powered insights, and keep track of your applications. We take your data seriously and only collect the information we need to deliver these features.

## What information we collect

| Data                                                                                                              | Purpose                                                                                      | Storage                                                                                    |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Job descriptions and page URLs that you actively analyze                                                          | Send to the Junting Orbit backend for scoring, cover letter generation, and history tracking | Temporarily processed by our secure API and optionally saved in your local browser storage |
| Application history (job URL, title, company, match score, green/red flags, analysis timestamp, “applied” status) | Display your past analyses in the History tab and power reminders such as “Mark as Applied”  | Stored locally in `chrome.storage.local` on your device                                    |
| Feedback you submit through the in-extension form                                                                 | Help improve the product and fix issues                                                      | Sent to our backend for processing                                                         |
| Authentication status (Supabase session cookie)                                                                   | Verify that you are signed in before calling protected APIs                                  | Stored as HTTP-only cookies managed by Supabase                                            |

We **do not** collect or retain your resume, personal notes, or other profile data unless you explicitly save it in the extension UI. We never sell your data.

## How we use the information

- Generate fit assessments, ATS scores, and cover letters via our secure API
- Display recent analyses inside the extension so you can revisit them later
- Troubleshoot errors and improve the product when you submit feedback

## How long we keep data

- Local history and cached assessments remain on your device until you clear them via the extension settings or remove the extension.
- Feedback submissions are retained as long as necessary to resolve the reported issue.
- Temporary analysis payloads are processed in-memory on our backend and not stored after the response is returned, unless you have a premium account where retention is required to provide additional features.

## Sharing and third parties

We use Supabase for authentication and secure session management. No other third-party analytics or advertising services are integrated into the extension or backend.

## Your choices

- You can clear all locally stored data at any time from the extension settings.
- Uninstalling the extension removes all local storage.
- Contact us at **juntingorbit@gmail.com** to request deletion of any feedback you submitted or to ask questions about this policy.

## Security

- All communication between the extension and the Junting Orbit backend uses HTTPS.
- Sensitive operations are performed in background/service-worker contexts with least-privilege permissions.
- We regularly review permissions and strip unused capabilities before each release.

## Changes

We may update this policy as the product evolves. Any significant changes will be noted here with an updated revision date. Continued use of the extension after changes take effect constitutes acceptance of the new terms.

---

If you have questions or concerns, please email **hello@juntingorbit.com**.
