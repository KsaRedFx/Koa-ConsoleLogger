import prettyBytes from 'pretty-bytes';
import onFinished from 'on-finished';

import { format } from '@lukeed/ms';
import { nanoid } from 'nanoid';
import { Context, Next } from 'koa';

import { ICKLConfig, TCKLParamsFn } from '../types/ICKLConfig';
import { CKLError, ICKLParameters } from '../types/ICKLParameters';


/**
 * Returns the time, in human readable format, between start and calltime
 * Handles up to microsecond (mu) precision
 */
const timeBetween = (start: number) => {
  const now = performance.now();
  const diff = now - start;

  if (diff > 1000) {
    return format(Math.round(diff / 1000));
  }

  return `${Math.round(diff)}μs`;
}

/**
 * Formats the parameters into the given order
 */
const formatter = (order: Array<keyof ICKLParameters>, parameters: ICKLParameters) => {
  const output: Array<unknown> = [];

  order.forEach((key: keyof ICKLParameters) => {
    if (!parameters) return;
    if (!parameters[key]) return;
    
    output.push(parameters[key]);
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
    size: ctx.response?.length ? prettyBytes(ctx.response?.length) : undefined,
    status: ctx.response?.status || 404,
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
    requestId: ctx.state.requestId || nanoid(6),
    deployId: config.deployId,
    ip: ctx.ip,
    url: ctx.originalUrl,
    origin: ctx.request?.header?.origin,
  }

  if (!ctx.state.requestId) {
    ctx.state.requestId = parameters.requestId;
  }

  formatter(config.order!, parameters);

  try {
    await next();
  } catch (error) {
    const ehancedParams = responseParameters(ctx, config, error as CKLError, parameters);
    formatter(config.order!, ehancedParams);

    // Re-throw so other processes can handle downstream
    throw error;
  }

  // Koa finished processing the request and no throw happened
  onFinished(ctx.res, (error) => {
    const ehancedParams = responseParameters(ctx, config, error as CKLError, parameters);
    formatter(config.order!, ehancedParams);
  });
};



