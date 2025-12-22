import { Context } from "koa";
import { CKLError, ICKLParameters } from "./ICKLParameters";

export type TIncludeErrorOpts = boolean | { message?: boolean, data?: boolean };
export type TCKLParamsFn = (ctx: Context, config: ICKLConfig, error?: CKLError, parameters?: ICKLParameters) => ICKLParameters;

export interface ICKLConfig {
  deployId?: string, // Custom deployment ID. If unset, randomly generated
  stringify?: boolean, // Should extra data, when found to be objects, be JSON.stringified? 
  chalk?: false, // Should colours be applied?
  break?: string // Separation character, defaults to '~'
  order?: Array<keyof ICKLParameters>,
  errorDataKey?: string, // Defaults to 'log'
  extraParamsFn?: TCKLParamsFn,
  throw?: boolean,
}