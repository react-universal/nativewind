import { Redacted, Schema } from 'effect';

export const AccessTokenString = Schema.String.pipe(Schema.brand('AccessToken'));
export const AccessToken = Schema.Redacted(AccessTokenString);
export type AccessToken = typeof AccessToken.Type;

/**
 * @domain identity
 * @param token ç
 * @returns {AccessToken}
 */
export const makeFromString = (token: string): AccessToken =>
  Redacted.make(AccessTokenString.make(token));

/**
 * @domain identity
 * @param token ç
 * @returns {AccessToken}
 */
export const makeFromRedacted = (token: Redacted.Redacted): AccessToken =>
  token as AccessToken;
