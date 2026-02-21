import { issueAccessToken, parseUserIdFromAuthorizationHeader } from './auth';

describe('auth token helpers', () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    process.env.ACCESS_TOKEN_SECRET = 'unit-test-secret-1234567890';
    process.env.ACCESS_TOKEN_EXPIRES_IN_SECONDS = '3600';
    process.env.ALLOW_LEGACY_DEVTOKEN = 'false';
  });

  afterAll(() => {
    process.env = envBackup;
  });

  it('issues signed token and parses user id', () => {
    const token = issueAccessToken('user_123');
    const parsed = parseUserIdFromAuthorizationHeader(`Bearer ${token}`);
    expect(parsed).toBe('user_123');
  });

  it('rejects tampered token', () => {
    const token = issueAccessToken('user_123');
    const tampered = `${token}x`;
    const parsed = parseUserIdFromAuthorizationHeader(`Bearer ${tampered}`);
    expect(parsed).toBeNull();
  });

  it('rejects legacy devtoken format', () => {
    const parsed = parseUserIdFromAuthorizationHeader(
      'Bearer devtoken.user_123',
    );
    expect(parsed).toBeNull();
  });

  it('can parse legacy devtoken when migration flag enabled', () => {
    process.env.ALLOW_LEGACY_DEVTOKEN = 'true';
    const parsed = parseUserIdFromAuthorizationHeader(
      'Bearer devtoken.user_123',
    );
    expect(parsed).toBe('user_123');
  });
});
