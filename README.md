# EKSA Logistic — Protected Website Forms

This package contains the website files AND the replacement Google Apps Script in `Google_Apps_Script_Code.gs.txt`.

## Required setup (cannot be performed from the static website)
1. Sign in to eksalogistic@gmail.com, open **EKSA Logistic — Website Inquiries** spreadsheet, then Extensions → Apps Script.
2. Replace ALL code in `Code.gs` with the contents of `Google_Apps_Script_Code.gs.txt` and Save.
3. Deploy → **Manage deployments** → select your existing Web app → Edit (pencil) → Version: **New version** → Deploy. This retains the existing /exec URL. Do NOT create a separate deployment unless you also update the website URL.
4. In GitHub, upload the extracted website files (`index.html`, `script.js`, `styles.css`, image assets, `CNAME`). Do not upload the `.gs.txt` script to GitHub; it is server code for Apps Script only.
5. Test a legitimate business, pharmacy and driver inquiry; confirm entries in Sheets and notification email. Test an immediate repeat from the same email and confirm it is blocked.

## Protection implemented
- Server-side honeypot and minimum/maximum form completion time.
- Validated type, name, email, data types, character lengths and request size.
- Server-side 2-minute repeat limit, max 3 submissions per email per day, max 100 total submissions per day.
- Spreadsheet formula injection defense; locks to reduce race conditions.
- Notification only after a successful spreadsheet append.

## Important limitations
- The public Apps Script endpoint can still be targeted by automated or distributed spam. These checks reduce abuse but are not a full CAPTCHA/WAF.
- Google Apps Script public cross-origin responses cannot be reliably read by the static website, so the browser cannot guarantee successful delivery; check Sheets.
- Public GitHub Pages cannot hide the Apps Script URL or keep secrets.
- No patient, prescription, or driver identity documents should be submitted.
- Daily counters in Script Properties are retained over time (small scale); clean up old keys periodically if required.
