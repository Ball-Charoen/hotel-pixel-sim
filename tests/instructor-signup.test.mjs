// Instructor self-registration (P2): sign up, automatic approval, and what the database function guards.
// The network client is a fake: these tests never create real Supabase accounts. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  useClientForTests, instructorSignUp, instructorSignIn, prepareInstructor, claimInstructor, confirmLink, PUBLIC_URL,
} from '../src/net/classroom.js';

/* A tiny stand-in for the Supabase client: one signed-in user (or none), an instructors table, a log of calls. */
function fake({ user = null, session = !!user, confirmed = true, instructors = [], signUpSession = null, signInFails = false } = {}) {
  const calls = [];
  const state = { user, instructors: [...instructors] };
  const c = {
    calls,
    auth: {
      getSession: async () => ({ data: { session: state.user ? { user: state.user } : null } }),
      signOut: async () => { calls.push(['signOut']); state.user = null; },
      signUp: async arg => {
        calls.push(['signUp', arg]);
        if (signUpSession) state.user = signUpSession;
        return { data: { session: signUpSession ? { user: signUpSession } : null, user: { id: 'new' } }, error: null };
      },
      signInWithPassword: async arg => {
        calls.push(['signIn', arg.email]);
        if (signInFails) return { data: null, error: new Error('Invalid login credentials') };
        state.user = user || state.user;
        return { data: {}, error: null };
      },
    },
    rpc: async (name, args) => {
      calls.push(['rpc', name, args]);
      // Same rules as supabase/migrations/20261016000000_instructor_signup.sql
      if (!state.user) return { error: new Error('not signed in') };
      if (state.user.is_anonymous) return { error: new Error('anonymous users cannot become instructors') };
      if (!confirmed) return { error: new Error('email not confirmed') };
      if (!state.instructors.includes(state.user.id)) state.instructors.push(state.user.id);
      return { data: { user_id: state.user.id }, error: null };
    },
    from: () => ({ select: () => ({ eq: async (_col, id) => ({ data: state.instructors.includes(id) ? [{ user_id: id }] : [], error: null }) }) }),
  };
  return c;
}
const teacher = { id: 't1', email: 'ajarn@uni.ac.th', is_anonymous: false, user_metadata: { display_name: 'อ.สมชาย', institution: 'คณะวิทยาการจัดการ' } };

test('sign-up sends name and institution as account data and the confirmation link back to the public site', async () => {
  const c = fake(); useClientForTests(c);
  const r = await instructorSignUp({ name: ' อ.สมชาย ', institution: ' คณะวิทยาการจัดการ ', email: ' ajarn@uni.ac.th ', password: 'secret-pass' });
  assert.deepEqual(r, { approved: false });
  const [, arg] = c.calls.find(x => x[0] === 'signUp');
  assert.equal(arg.email, 'ajarn@uni.ac.th');
  assert.deepEqual(arg.options.data, { display_name: 'อ.สมชาย', institution: 'คณะวิทยาการจัดการ' });
  assert.equal(arg.options.emailRedirectTo, confirmLink());
  assert.ok(!c.calls.some(x => x[0] === 'rpc'), 'no approval before the email is confirmed (no session yet)');
});

test('the confirmation link goes to the public site from localhost and the real address elsewhere', () => {
  assert.equal(confirmLink({ hostname: 'localhost', origin: 'http://localhost:5173', pathname: '/' }), PUBLIC_URL);
  assert.equal(confirmLink({ hostname: '192.168.0.108', origin: 'http://192.168.0.108:5173', pathname: '/' }), PUBLIC_URL);
  assert.equal(confirmLink({ hostname: 'ball-charoen.github.io', origin: 'https://ball-charoen.github.io', pathname: '/hotel-pixel-sim/' }),
    'https://ball-charoen.github.io/hotel-pixel-sim/');
});

test('when the project does not need email confirmation, the new account is approved at once', async () => {
  const c = fake({ signUpSession: teacher }); useClientForTests(c);
  assert.deepEqual(await instructorSignUp({ name: 'x', email: 'ajarn@uni.ac.th', password: 'secret-pass' }), { approved: true });
  const rpc = c.calls.find(x => x[0] === 'rpc');
  assert.equal(rpc[1], 'register_instructor');
  assert.deepEqual(rpc[2], { p_name: 'อ.สมชาย', p_institution: 'คณะวิทยาการจัดการ' });
});

test('first sign-in after confirming the email approves the instructor automatically', async () => {
  const c = fake({ user: teacher }); useClientForTests(c);
  await instructorSignIn('ajarn@uni.ac.th', 'secret-pass');
  assert.equal(c.calls.filter(x => x[0] === 'rpc').length, 1);
  assert.ok(!c.calls.some(x => x[0] === 'signOut'), 'stays signed in');
});

test('an already approved instructor signs in without another approval call', async () => {
  const c = fake({ user: teacher, instructors: ['t1'] }); useClientForTests(c);
  await instructorSignIn('ajarn@uni.ac.th', 'secret-pass');
  assert.ok(!c.calls.some(x => x[0] === 'rpc'));
});

test('an unconfirmed email is not approved: sign-in is refused and the session is closed', async () => {
  const c = fake({ user: teacher, confirmed: false }); useClientForTests(c);
  await assert.rejects(instructorSignIn('ajarn@uni.ac.th', 'secret-pass'), /not-instructor/);
  assert.ok(c.calls.some(x => x[0] === 'signOut'));
});

test('students (anonymous sign-in) can never become instructors', async () => {
  const student = { id: 's1', is_anonymous: true, user_metadata: {} };
  const c = fake({ user: student }); useClientForTests(c);
  assert.equal(await prepareInstructor(), false);
  await assert.rejects(claimInstructor(), /not-instructor/);
  assert.ok(!c.calls.some(x => x[0] === 'rpc'), 'the server is not even asked');
});

test('opening the instructor screen after the confirmation link approves the person right away', async () => {
  const c = fake({ user: teacher }); useClientForTests(c);
  assert.equal(await prepareInstructor(), true);
});

test('migration: automatic approval is a function students cannot call, with no trigger on auth.users', () => {
  const sql = fs.readFileSync(new URL('../supabase/migrations/20261016000000_instructor_signup.sql', import.meta.url), 'utf8');
  const code = sql.replace(/--.*$/gm, '');
  assert.match(code, /create or replace function public\.register_instructor/, 'safe to run twice');
  assert.match(code, /add column if not exists approval/);
  assert.match(code, /revoke all on function public\.register_instructor\(text, text\) from public, anon/);
  assert.match(code, /grant execute on function public\.register_instructor\(text, text\) to authenticated/);
  assert.match(code, /'is_anonymous'/, 'anonymous sign-ins are rejected inside the function');
  assert.match(code, /email_confirmed_at is null then raise exception/, 'only confirmed emails are approved');
  assert.match(code, /approval[^;]*check \(approval in \('owner', 'auto'\)\)/, 'how each instructor was approved is recorded');
  assert.doesNotMatch(code, /create (or replace )?trigger/i, 'a trigger on auth.users could block student sign-ins');
});
