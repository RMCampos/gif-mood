export interface LoginUser {
  id: string;
  username: string;
  email: string;
  password: string;
  disabledAt: Date | null;
}

export interface LoginIdentifierFilter {
  OR: Array<
    | { email: { equals: string; mode: 'insensitive' } }
    | { username: { equals: string; mode: 'insensitive' } }
  >;
}

export function normalizeIdentifier(identifier: string): string {
  return identifier.trim();
}

export function buildLoginIdentifierFilter(identifier: string): LoginIdentifierFilter {
  const normalized = normalizeIdentifier(identifier);
  return {
    OR: [
      { email: { equals: normalized, mode: 'insensitive' } },
      { username: { equals: normalized, mode: 'insensitive' } },
    ],
  };
}

interface AuthenticateLoginInput {
  identifier: string;
  password: string;
  findUserByIdentifier: (identifier: string) => Promise<LoginUser | null>;
  comparePassword: (plain: string, hash: string) => Promise<boolean>;
}

export async function authenticateLogin(input: AuthenticateLoginInput): Promise<LoginUser | null> {
  const normalizedIdentifier = normalizeIdentifier(input.identifier);
  if (!normalizedIdentifier) {
    return null;
  }

  const user = await input.findUserByIdentifier(normalizedIdentifier);
  if (!user || user.disabledAt) {
    return null;
  }

  const valid = await input.comparePassword(input.password, user.password);
  if (!valid) {
    return null;
  }

  return user;
}