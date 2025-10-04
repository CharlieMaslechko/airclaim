import { ApiSuccess } from '../shared/payload';
import { User } from '../data/user';

/**
 * The response for the signup API.
 */
export type SignupResponse = ApiSuccess<
  User,
  {
    /** The access token. */
    token: string;
    /** The refresh token. */
    refresh_token: string;
  }
>;
