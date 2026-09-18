// iOS replacement for Maestro's `openLink`: asks the fixture server (port 8090, see
// e2e/fixtures/open-link.mjs) to open the link, so a `simctl openurl` timeout is retried.
//
// env: LINK; SIM_UDID (optional, which simulator, else the booted one); SOFT=true to log
// a failure instead of throwing (the warm-up's later steps must still run).
const device = typeof SIM_UDID === 'undefined' ? '' : SIM_UDID;
const soft = typeof SOFT !== 'undefined' && SOFT === 'true';
let failure = '';
let attempts = 1;
try {
  const response = http.post(
    'http://localhost:8090/__open-link?url=' + encodeURIComponent(LINK) + '&device=' + encodeURIComponent(device),
    { body: '' }
  );
  if (response.ok) attempts = json(response.body).attempts;
  else failure = 'open-link failed: HTTP ' + response.status + ' ' + response.body;
} catch (error) {
  failure = 'open-link failed: ' + error;
}
if (failure && !soft) throw new Error(failure);
// console.log lands in maestro.log next to the flow.
if (failure) console.log(failure);
else if (attempts > 1) console.log('open-link needed ' + attempts + ' attempts for ' + LINK);
