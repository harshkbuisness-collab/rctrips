# Browser MP4 Download Fix

Cloud renders now download through `/api/download` on the same application origin.

The route:
- requires the tool login;
- only accepts safe `renders/` Private Blob paths;
- creates a short-lived signed read URL server-side;
- streams the MP4 back with `Content-Disposition: attachment`;
- does not expose a permanent public Blob URL.

The editor automatically starts the download when rendering completes and also keeps a **Download MP4** button for a manual one-click retry.
