# EKSA Logistic — upgraded inquiry forms

Upload the contents of this folder to the existing GitHub Pages repository root, replacing existing files. Keep the current Google Apps Script deployment URL; it is already embedded in script.js.

Business and pharmacy forms now collect delivery areas, frequency, pickup location, and estimated volume. Driver form collects vehicle, availability, experience, and licence confirmation without requesting documents. Data is sent through the existing script fields, with additional details saved in the Message column.

Basic client-side spam friction includes a hidden honeypot, minimum completion time and 60-second repeat-submit delay. These do NOT constitute reliable server-side spam protection: a bot can bypass browser JavaScript. Add server-side rate limiting/CAPTCHA validation using an appropriate backend before high-volume production use.

The Apps Script endpoint uses a no-cors request, so the browser cannot verify the response. A 'sent' notice is not proof of delivery; verify test records in Sheets and notification emails. Public Apps Script web apps should not receive sensitive patient or driver documents.

Test all three forms after upload. No Apps Script redeployment is required for these field additions because extra details are serialized into the existing message field.
