function getJwtSecret(): string {
  const secret = process.env['JWT_SECRET'];
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set to a unique value with at least 32 characters');
  }
  return secret;
}

export const jwtSecret = getJwtSecret();
