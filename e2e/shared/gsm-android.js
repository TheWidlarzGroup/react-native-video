// Starts or ends an incoming call on the Android emulator through the fixture server (see
// e2e/fixtures/gsm.mjs). A ringing call takes the app's audio focus; ending it gives it back.
//
// env: ACTION (call or cancel); FIXTURE_PORT (optional, where the fixture server listens,
// else 8090); ANDROID_SERIAL (optional, which emulator, else the one adb picks); SOFT=true to
// log a failure instead of throwing (the clean-up in onFlowComplete, where the call may be
// over already).
const port = typeof FIXTURE_PORT === 'undefined' || FIXTURE_PORT === '' ? '8090' : FIXTURE_PORT;
const device = typeof ANDROID_SERIAL === 'undefined' ? '' : ANDROID_SERIAL;
const soft = typeof SOFT !== 'undefined' && SOFT === 'true';
let failure = '';
try {
  const response = http.post(
    'http://localhost:' + port + '/__gsm?action=' + encodeURIComponent(ACTION) + '&device=' + encodeURIComponent(device),
    { body: '' }
  );
  if (!response.ok) failure = 'gsm ' + ACTION + ' failed: HTTP ' + response.status + ' ' + response.body;
} catch (error) {
  failure = 'gsm ' + ACTION + ' failed: ' + error;
}
if (failure && !soft) throw new Error(failure);
if (failure) console.log(failure);
