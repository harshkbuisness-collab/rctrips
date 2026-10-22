# v1.9.4 — Vercel Sandbox root hard fix

The previous v1.9.3 fix used `sandbox.mkDir('remotion-bundle')`. In the failing production environment that did not create the exact directory used by Remotion.

v1.9.4 now:

1. runs `mkdir -p /vercel/sandbox/remotion-bundle` inside the Sandbox,
2. verifies the directory with `test -d`,
3. only then calls `addBundleToSandbox()`.

This specifically targets the production error:

`cannot create directory /vercel/sandbox/remotion-bundle/public: No such file or directory`
