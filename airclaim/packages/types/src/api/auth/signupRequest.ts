import { ApiRequest } from '../shared/payload/ApiRequest';

export interface SignupForm {
  email: string;
  password: string;
  password_confirmation: string;
  name: string;
}

export type SignupRequest = ApiRequest<SignupForm>;
