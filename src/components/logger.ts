import prettyBytes from 'pretty-bytes';
import onFinished from 'on-finished';
import chalkPipe from 'chalk-pipe';

import { format } from '@lukeed/ms';
import { nanoid } from 'nanoid';
import { Context, Next } from 'koa';

import { ICKLConfig, ICKLConfigInternal, TCKLParamsFn } from '../types/ICKLConfig';
import { CKLError, ICKLParameters } from '../types/ICKLParameters';
import { chalkColourMap } from './config';



const getChalk = (formatters: ICKLConfigInternal['formatters'], param: string) => {
  if (!formatters[param]) {
    formatters[param] = chalkPipe(param);
  }

  return formatters[param];
}


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
const formatter = (config: ICKLConfigInternal, parameters: ICKLParameters) => {
  const output: Array<unknown> = [];

  config.order?.forEach((key: keyof ICKLParameters) => {
    if (!parameters) return;
    if (parameters[key] === undefined || parameters[key] === null) return;

    let paramData = parameters[key];

    if (config.chalk && chalkColourMap[key]) {
      // Apply ANSI colouring on a per-field basis.
      const chalk = getChalk(config.formatters, chalkColourMap[key]);
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
const responseParameters: TCKLParamsFn = (ctx, config, error?, param?) => {
  const fields = config.fields!;
  if (!param) param = {};

  param.errorMessage = error?.message;

  if (fields.has('flow')) param.flow = error ? 'xxx' : '<--';
  if (fields.has('errorData') && error && Object.prototype.hasOwnProperty.call(error, config.errorDataKey!)) param.errorData = JSON.stringify(error![config.errorDataKey!]);
  if (fields.has('context') && ctx.state.cklcontext) param.context = JSON.stringify(ctx.state.cklcontext);
  if (fields.has('event')) param.event = error ? 'closed' : 'finished';
  if (fields.has('size') && ctx.response?.length) param.size = prettyBytes(ctx.response.length, { space: false });
  if (fields.has('status')) param.status = error ? error.status as number || 500 : ctx.status || ctx.response?.status || 404;
  if (fields.has('time')) param.time = timeBetween(param?.startTime || performance.now());
  if (fields.has('timestamp')) param.timestamp = new Date();

  const custom = config.extraParamsFn ? config.extraParamsFn(ctx, config, error, param) : {};
  Object.assign(param, custom);
  return param;
};


export const logger = async (config: ICKLConfigInternal, ctx: Context, next: Next) => {
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

  if (config.fields?.has('timestamp')) parameters.timestamp = new Date();

  if (!ctx.state.requestId) {
    ctx.state.requestId = parameters.requestId;
  }

  formatter(config, parameters);

  try {
    await next();
  } catch (error) {
    const enhancedParams = responseParameters(ctx, config, error as CKLError, parameters);
    formatter(config, enhancedParams);

    // Re-throw so other processes can handle downstream
    if (config.throw) {
      throw error;
    }
  }

  // Koa finished processing the request and no throw happened
  onFinished(ctx.res, (error) => {
    const enhancedParams = responseParameters(ctx, config, error as CKLError, parameters);
    formatter(config, enhancedParams);
  });
};
