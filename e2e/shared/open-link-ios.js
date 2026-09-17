// Run by open-scenario.yaml on iOS in place of Maestro's `openLink`. Asks the fixture
// server to open the link, which retries `simctl openurl` when it times out - something
// no flow can do, because Maestro's `retry` and `optional` do not catch that failure. See
// e2e/fixtures/open-link.mjs. The port is the fixture server's (8090, the same one
// test-app/src/e2e/fixtures.ts points the players at).
//
// env: LINK; SIM_UDID (optional, `maestro test -e SIM_UDID=...`: which simulator, else the
// booted one); SOFT=true to report a failure instead of throwing (the warm-up, whose
// later steps must still run).
var device = typeof SIM_UDID === 'undefined' ? '' : SIM_UDID;
var soft = typeof SOFT !== 'undefined' && SOFT === 'true';
var failure = '';
var attempts = 1;
try {
  var response = http.post(
    'http://localhost:8090/__open-link?url=' + encodeURIComponent(LINK) + '&device=' + encodeURIComponent(device),
    { body: '' }
  );
  if (response.ok) attempts = json(response.body).attempts;
  else failure = 'open-link failed: HTTP ' + response.status + ' ' + response.body;
} catch (error) {
  // Nothing listening: the fixture server is not running.
  failure = 'open-link failed: ' + error;
}
if (failure && !soft) throw new Error(failure);
// Lands in maestro.log next to the flow; the server's own log is not in the artifact.
if (failure) console.log(failure);
else if (attempts > 1) console.log('open-link needed ' + attempts + ' attempts for ' + LINK);
