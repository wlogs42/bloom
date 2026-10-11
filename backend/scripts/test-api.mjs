import assert from 'node:assert/strict';
const baseUrl = process.env.API_TEST_URL || 'http://localhost:5050';
async function send(path, method = 'GET', body, token) {
  return fetch(`${baseUrl}/api/${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(10000),
  });
}
async function json(path, method, body, token, expected = 200) {
  const response = await send(path, method, body, token);
  assert.equal(response.status, expected, `${method} ${path}`);
  return expected === 204 ? null : response.json();
}
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);
function register(input, photo = new Blob([png], { type: 'image/png' })) {
  const form = new FormData();
  for (const [key, value] of Object.entries(input)) form.append(key, value);
  if (photo) form.append('photo', photo, 'photo.png');
  return fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(10000),
  });
}
const claims = (token) => JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
const admin = await json('auth/login', 'POST', { email: 'admin@gmail.com', password: '123456' });
assert.equal(admin.user.email, 'admin@gmail.com');
assert.deepEqual(Object.keys(admin.user).sort(), ['email', 'id', 'name', 'photo']);
assert.equal(admin.user.photo, null);
assert.equal(admin.token.split('.').length, 3);
assert.equal(claims(admin.token).sub, admin.user.id);
assert.equal((await send('me/workspace')).status, 401);
assert.equal((await send('me/workspace', 'GET', undefined, 'x'.repeat(64))).status, 401);
assert.equal(
  (await send('auth/login', 'POST', { email: 'admin@gmail.com', password: 'wrong' })).status,
  401
);
assert.equal((await send('auth/login', 'POST', {})).status, 400);
const suffix = Date.now();
const aliceInput = {
  name: 'Alice test',
  email: `alice-${suffix}@example.com`,
  password: 'test-password-123',
};
const bobInput = {
  name: 'Bob test',
  email: `bob-${suffix}@example.com`,
  password: 'test-password-123',
};
assert.equal((await register(aliceInput, null)).status, 400);
assert.equal((await register(aliceInput, new Blob(['not an image']))).status, 400);
assert.equal((await send('auth/login', 'POST', aliceInput)).status, 401);
const aliceResponse = await register(aliceInput);
assert.equal(aliceResponse.status, 201);
const alice = await aliceResponse.json();
const bob = await (await register(bobInput)).json();
assert.equal((await register(aliceInput)).status, 409);
assert.equal(claims(alice.token).sub, alice.user.id);
assert.equal(claims(alice.token).email, aliceInput.email);
assert.match(alice.user.photo, /^\/uploads\/[0-9a-f]{32}\.png$/);
const photo = await fetch(`${baseUrl}${alice.user.photo}`);
assert.equal(photo.status, 200);
assert.equal(photo.headers.get('content-type'), 'image/png');
assert.deepEqual(Buffer.from(await photo.arrayBuffer()), png);
assert.equal((await json('me', 'GET', undefined, alice.token)).photo, alice.user.photo);
assert.equal((await send('me', 'GET', undefined, `${alice.token.slice(0, -4)}AAAA`)).status, 401);
const blank = await json('me/workspace', 'GET', undefined, alice.token);
assert.deepEqual(blank.tasks, []);
assert.deepEqual(blank.sessions, []);
const task = { title: 'Моє реальне завдання', category: 'Робота', minutes: 25, completed: false };
const added = await json('me/tasks', 'POST', task, alice.token);
const id = added.tasks[0].id;
assert.equal(added.tasks.length, 1);
assert.equal((await send('me/tasks', 'POST', { ...task, title: '   ' }, alice.token)).status, 400);
assert.equal((await json('me/workspace', 'GET', undefined, bob.token)).tasks.length, 0);
assert.equal((await send(`me/tasks/${id}`, 'PUT', task, bob.token)).status, 404);
assert.equal((await send(`me/tasks/${id}`, 'DELETE', undefined, bob.token)).status, 404);
const updated = await json(
  `me/tasks/${id}`,
  'PUT',
  { ...task, title: 'Оновлено', completed: true },
  alice.token
);
assert.equal(updated.tasks[0].completed, true);
assert.ok(updated.tasks[0].completedAt);
const deleted = await json(`me/tasks/${id}`, 'DELETE', undefined, alice.token);
assert.equal(deleted.tasks.length, 0);
await json('me/tasks', 'POST', task, alice.token);
await json('me/timer', 'POST', { action: 'duration', durationMinutes: 1 }, alice.token);
const started = await json('me/timer', 'POST', { action: 'start' }, alice.token);
assert.ok(started.timer.deadline);
const again = await json('me/timer', 'POST', { action: 'start' }, alice.token);
assert.equal(again.timer.deadline, started.timer.deadline);
await new Promise((r) => setTimeout(r, 1100));
const paused = await json('me/timer', 'POST', { action: 'pause' }, alice.token);
assert.equal(paused.timer.deadline, null);
assert.ok(paused.timer.remainingMs < 60000);
const reset = await json('me/timer', 'POST', { action: 'reset' }, alice.token);
assert.equal(reset.timer.remainingMs, 60000);
assert.equal(reset.sessions.length, 0);
await json('me/timer', 'POST', { action: 'start' }, alice.token);
assert.equal(
  (await send('me', 'PUT', { name: 'Alice', email: bobInput.email }, alice.token)).status,
  409
);
const newEmail = `changed-${suffix}@example.com`;
const profile = await json(
  'me',
  'PUT',
  { name: 'Оновлений профіль', email: newEmail },
  alice.token
);
assert.equal(profile.email, newEmail);
const otherSession = await json('auth/login', 'POST', {
  email: newEmail,
  password: aliceInput.password,
});
assert.equal(
  (
    await send(
      'me/password',
      'PUT',
      { currentPassword: 'bad', newPassword: 'changed-password' },
      alice.token
    )
  ).status,
  403
);
await json(
  'me/password',
  'PUT',
  { currentPassword: aliceInput.password, newPassword: 'changed-password' },
  alice.token,
  204
);
assert.equal((await send('me', 'GET', undefined, otherSession.token)).status, 401);
assert.equal(
  (await send('auth/login', 'POST', { email: newEmail, password: aliceInput.password })).status,
  401
);
const relogin = await json('auth/login', 'POST', { email: newEmail, password: 'changed-password' });
assert.equal((await json('me/workspace', 'GET', undefined, relogin.token)).tasks.length, 1);
await json('me/logout', 'POST', undefined, relogin.token, 204);
assert.equal((await send('me', 'GET', undefined, relogin.token)).status, 401);
console.log('PASS: auth, tasks, profile, timer. Waiting 1 minute for a focus session…');
await new Promise((r) => setTimeout(r, 61000));
const finished = await json('me/workspace', 'GET', undefined, alice.token);
assert.equal(finished.sessions.length, 1);
assert.equal(finished.sessions[0].minutes, 1);
assert.equal(finished.timer.deadline, null);
assert.equal(finished.timer.remainingMs, 0);
assert.equal((await json('me/workspace', 'GET', undefined, alice.token)).sessions.length, 1);
assert.equal((await json('me/workspace', 'GET', undefined, bob.token)).sessions.length, 0);
await json('me/logout', 'POST', undefined, alice.token, 204);
await json('me/logout', 'POST', undefined, bob.token, 204);
await json('me/logout', 'POST', undefined, admin.token, 204);
console.log('PASS: focus session recorded.');
