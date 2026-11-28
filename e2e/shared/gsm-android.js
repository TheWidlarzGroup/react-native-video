// Starts or ends an incoming call on the Android emulator through the fixture server (see
// e2e/fixtures/gsm.mjs). A ringing call takes the app's audio focus; ending it gives it back.
//
// env: ACTION (call or cancel); FIXTURE_PORT (optional, where the fixture server listens,
// else 8090); ANDROID_SERIAL (optional, which emulator, else the one adb picks).
const port = typeof FIXTURE_PORT === 'undefined' || FIXTURE_PORT === '' ? '8090' : FIXTURE_PORT;
const device = typeof ANDROID_SERIAL === 'undefined' ? '' : ANDROID_SERIAL;
const response = http.post(
  'http://localhost:' + port + '/__gsm?action=' + encodeURIComponent(ACTION) + '&device=' + encodeURIComponent(device),
  { body: '' }
);
if (!response.ok) throw new Error('gsm ' + ACTION + ' failed: HTTP ' + response.status + ' ' + response.body);
