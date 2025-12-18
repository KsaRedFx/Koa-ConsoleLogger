
export type CKLError = Error & { [index: string]: unknown };

export interface ICKLParameters {
  [index: string]: unknown,
  startTime?: number,
  requestId?: string,
  deployId?: string,
  origin?: string,
  ip?: string,
  time?: string,
  size?: string,
  flow?: string,
  status?: number,
  break?: string,
  context?: string,
  event?: string,
  errorMessage?: string,
  errorData?: string,
}