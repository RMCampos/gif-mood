import test from 'node:test';
import assert from 'node:assert/strict';
import {
  authenticateLogin,
  buildLoginIdentifierFilter,
  normalizeIdentifier,
  type LoginUser,
} from '../services/auth-login.service';

const baseUser: LoginUser = {
  id: 'u1',
  username: 'ricardo',
  email: 'ricardo@example.com',
  password: 'hashed-password',
  disabledAt: null,
};

test('normalizeIdentifier trims surrounding whitespace', () => {
  assert.equal(normalizeIdentifier('  ricardo@example.com  '), 'ricardo@example.com');
});

test('buildLoginIdentifierFilter creates case-insensitive email and username filter', () => {
  const filter = buildLoginIdentifierFilter('  RiCaRdO  ');
  assert.deepEqual(filter, {
    OR: [
      { email: { equals: 'RiCaRdO', mode: 'insensitive' } },
      { username: { equals: 'RiCaRdO', mode: 'insensitive' } },
    ],
  });
});

test('authenticateLogin succeeds for email login', async () => {
  const user = await authenticateLogin({
    identifier: 'ricardo@example.com',
    password: 'secret',
    findUserByIdentifier: async (identifier) => {
      assert.equal(identifier, 'ricardo@example.com');
      return { ...baseUser };
    },
    comparePassword: async (plain, hash) => {
      assert.equal(plain, 'secret');
      assert.equal(hash, 'hashed-password');
      return true;
    },
  });

  assert.deepEqual(user, baseUser);
});

test('authenticateLogin succeeds for username login (trimmed input)', async () => {
  const user = await authenticateLogin({
    identifier: '  ricardo  ',
    password: 'secret',
    findUserByIdentifier: async (identifier) => {
      assert.equal(identifier, 'ricardo');
      return { ...baseUser };
    },
    comparePassword: async () => true,
  });

  assert.deepEqual(user, baseUser);
});

test('authenticateLogin rejects blank identifier and does not call dependencies', async () => {
  let findCalled = false;
  let compareCalled = false;

  const user = await authenticateLogin({
    identifier: '   ',
    password: 'secret',
    findUserByIdentifier: async () => {
      findCalled = true;
      return { ...baseUser };
    },
    comparePassword: async () => {
      compareCalled = true;
      return true;
    },
  });

  assert.equal(user, null);
  assert.equal(findCalled, false);
  assert.equal(compareCalled, false);
});

test('authenticateLogin rejects when user is not found', async () => {
  let compareCalled = false;

  const user = await authenticateLogin({
    identifier: 'unknown',
    password: 'secret',
    findUserByIdentifier: async () => null,
    comparePassword: async () => {
      compareCalled = true;
      return true;
    },
  });

  assert.equal(user, null);
  assert.equal(compareCalled, false);
});

test('authenticateLogin rejects disabled users', async () => {
  let compareCalled = false;

  const user = await authenticateLogin({
    identifier: 'ricardo',
    password: 'secret',
    findUserByIdentifier: async () => ({
      ...baseUser,
      disabledAt: new Date('2026-03-27T00:00:00Z'),
    }),
    comparePassword: async () => {
      compareCalled = true;
      return true;
    },
  });

  assert.equal(user, null);
  assert.equal(compareCalled, false);
});

test('authenticateLogin rejects invalid password', async () => {
  const user = await authenticateLogin({
    identifier: 'ricardo',
    password: 'wrong-secret',
    findUserByIdentifier: async () => ({ ...baseUser }),
    comparePassword: async () => false,
  });

  assert.equal(user, null);
});
