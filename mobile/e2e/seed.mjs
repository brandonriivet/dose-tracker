// Creates the test user directly in the Auth emulator.
//
// The emulator's REST surface is the real Identity Toolkit API on a local
// port, and it accepts any API key, so this needs no credentials and no
// admin SDK. Everything else the test needs — vials, doses — is created
// through the UI by the flow itself, because those write paths are part of
// what's being tested.
const AUTH = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const KEY = 'any-key-works-against-the-emulator';

export const TEST_USER = { email: 'e2e@dose.test', password: 'e2e-password' };

export async function seedUser() {
  const res = await fetch(`${AUTH}/accounts:signUp?key=${KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...TEST_USER, returnSecureToken: true }),
  });
  const body = await res.json();
  if (!res.ok && body?.error?.message !== 'EMAIL_EXISTS') {
    throw new Error(`seeding the test user failed: ${JSON.stringify(body)}`);
  }
  return body.localId;
}
