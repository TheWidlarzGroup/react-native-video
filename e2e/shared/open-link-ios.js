// Run by open-scenario.yaml on iOS in place of Maestro's `openLink` (env: LINK). Asks the
// fixture server to open the link, which retries `simctl openurl` when it times out -
// something no flow can do, because Maestro's `retry` and `optional` do not catch that
// failure. See e2e/fixtures/open-link.mjs. The port is the fixture server's (8090, the
// same one test-app/src/e2e/fixtures.ts points the players at).
var response = http.post('http://localhost:8090/__open-link?url=' + encodeURIComponent(LINK), { body: '' });
if (!response.ok) {
  throw new Error('open-link failed: HTTP ' + response.status + ' ' + response.body);
}
