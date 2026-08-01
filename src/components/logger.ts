import prettyBytes from 'pretty-bytes';
import onFinished from 'on-finished';
import chalkPipe from 'chalk-pipe';

import { format } from '@lukeed/ms';
import { nanoid } from 'nanoid';
import { Context, Next } from 'koa';

import { ICKLConfig, TCKLParamsFn } from '../types/ICKLConfig';
import { CKLError, ICKLParameters } from '../types/ICKLParameters';
import { chalkColourMap } from './config';


/**
 * Returns the time, in human readable format, between start and calltime
 * Handles up to microsecond (mu) precision
 */
const timeBetween = (start: number) => {
  const now = performance.now();
  const duration = now - start;

  if (duration > 1.0) {
    return format(Math.round(duration));
  }

  return `${Math.round(duration * 1000)} μs`;
}

/**
 * Formats the parameters into the given order
 */
const formatter = (order: Array<keyof ICKLParameters>, parameters: ICKLParameters, chalkEnabled?: boolean) => {
  const output: Array<unknown> = [];

  order.forEach((key: keyof ICKLParameters) => {
    if (!parameters) return;
    if (!parameters[key]) return;
    let paramData = parameters[key];

    if (chalkEnabled) {
      // Apply ANSI colouring on a per-field basis.
      const chalkKey = chalkColourMap[key];
      const chalk = chalkPipe(chalkKey);
      
      paramData = chalk(paramData);
    }

    output.push(paramData);
  });

  if (output.at(-1) === parameters.break) {
    output.pop();
  }

  console.log(...output);
}

/**
 * Adds parameters to the existing parameter object, after response has been handled from Koa
 */
const responseParameters: TCKLParamsFn = (ctx, config, error?, parameters?) => {
  const response = {
    ...parameters || {},
    flow: error ? 'xxx' : '<--',
    errorMessage: error?.message ? error.message : undefined,
    errorData: error && config.errorDataKey! in error ? JSON.stringify(error[config.errorDataKey!]) : undefined,
    context: ctx.state.cklcontext ? JSON.stringify(ctx.state.cklcontext) : undefined,
    event: error ? 'closed' : 'finished',
    size: ctx.response?.length ? prettyBytes(ctx.response?.length, { space: false }) : undefined,
    status: error ? error.status as number || 500 : ctx.status || ctx.response?.status || 404,
    time: timeBetween(parameters?.startTime || performance.now()),
  }

  const custom = config.extraParamsFn ? config.extraParamsFn(ctx, config, error, response) : {};
  return { ...response, ...custom };
};


export const logger = async (config: ICKLConfig, ctx: Context, next: Next) => {
  const parameters: ICKLParameters = {
    flow: '-->',
    break: config.break || '~',
    startTime: performance.now(),
    requestId: ctx.state.requestId || nanoid(4),
    deployId: config.deployId,
    ip: ctx.ip,
    method: ctx.method || 'UNKNOWN',
    url: ctx.originalUrl,
    origin: ctx.request?.header?.origin,
  }

  if (!ctx.state.requestId) {
    ctx.state.requestId = parameters.requestId;
  }

  formatter(config.order!, parameters, config.chalk);

  try {
    await next();
  } catch (error) {
    const enhancedParams = responseParameters(ctx, config, error as CKLError, parameters);
    formatter(config.order!, enhancedParams, config.chalk);

    // Re-throw so other processes can handle downstream
    if (config.throw) {
      throw error;
    }
  }

  // Koa finished processing the request and no throw happened
  onFinished(ctx.res, (error) => {
    const ehancedParams = responseParameters(ctx, config, error as CKLError, parameters);
    formatter(config.order!, ehancedParams, config.chalk);
  });
};



