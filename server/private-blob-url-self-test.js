import assert from 'node:assert/strict';
import fs from 'node:fs';

const helper=fs.readFileSync(new URL('../src/lib/privateBlob.js', import.meta.url),'utf8');
const upload=fs.readFileSync(new URL('../src/app/api/upload-url/route.js', import.meta.url),'utf8');
const blobUrl=fs.readFileSync(new URL('../src/app/api/blob-url/route.js', import.meta.url),'utf8');

assert.ok(helper.includes("access: 'private'"), 'signed GET must explicitly use private access');
assert.ok(helper.includes("useCache: false"), 'fresh media signed GET should bypass cache');
assert.ok(helper.includes("pathname: safePath"), 'signed token should be scoped to exact private blob path');
assert.ok(helper.includes(".undefined."), 'malformed undefined-host guard missing');
assert.ok(helper.includes(".private.blob.vercel-storage.com"), 'private blob host validation missing');
assert.ok(upload.includes("access:'private'"), 'presigned PUT must declare private access');
assert.ok(blobUrl.includes("access:'private'"), 'blob-url endpoint must declare private access');
console.log('private blob URL self-test passed');
