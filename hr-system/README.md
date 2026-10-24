# RC Trips HR Attendance System (Google Apps Script)

Bound to the Google Sheet on rctrips.info@gmail.com. Emails go out from hr@rctrips.com (Outlook, via Microsoft Graph).

## Install (one time)
1. Sheet > Extensions > Apps Script. Create files `Setup`, `Attendance`, `Today`, `Leave`, `Outlook`, `Email` and paste the matching `.gs` code. Also create `Employees` with the private `EMPLOYEE_DATA` list (not in GitHub).
2. No library needed (Microsoft login is built into `Outlook.gs`). Services (+) > Drive API > Add (needed to read PDF/Excel uploads). Also create file `Upload`.
3. Project Settings > Script Properties > add `CLIENT_ID`, `TENANT_ID`, `CLIENT_SECRET` (never put these in code or GitHub).
4. Reload the sheet. Menu **HR System > 1. First-time Setup**.
5. Employees load automatically from `Employees.gs` (or HR System > Load / Update Employees). Add holidays in `Holidays`.
6. **HR System > 2. Connect Outlook** and sign in as hr@rctrips.com.

## Monthly use
- Month sheet (`Att Nov-2026`): one row per employee, one column per day, plus Late / Leave / OD totals. Day cell = in-time (red = late, green = on time), `LEAVE`, `OD`, `SUN` (Sunday) or `HOL` (holiday from `Holidays`).
- Daily: the `Today` sheet shows only today's date. HR picks LEAVE or OD; it is saved into the month sheet instantly. A 1am trigger moves `Today` to the next date and creates the new month sheet on day 1. When a month ends, its sheet moves to the bottom of `Attendance History` (all finished months, one below the other). Uploading a file for a finished month fills it there.
- HR System > Upload Attendance File (PDF / Excel) fills in-times. No punch on uploaded dates = LEAVE. HR's own LEAVE / OD are never overwritten.
- Month end: **Calculate Month Summary** > fill salary deduction for "Over Late Limit = Yes" > **Send Test Email** > **Send Monthly Emails**. 

## Rules
- Office starts 10:00. In time after 10:10 = Late (Settings > Late After). More than 5 lates/month = deduction (amount entered by HR).
- Sunday = Week Off. Saturday = half day (10 to 3).
- 1.5 paid leaves/month. HR enters opening balance (till Oct 2026) in `Leave Balance`; tracking starts Nov 2026.
- No punch and no mark = LEAVE (counts against leave balance).
