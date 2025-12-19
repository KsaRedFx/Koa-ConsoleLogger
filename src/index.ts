import { Context, Middleware, Next } from "koa";

import { mergeConfig } from "./components/config";
import { ICKLConfig } from "./types/ICKLConfig";
import { logger as CKL } from "./components/logger";


/**
 * CKLogger creator
 * Returns a logger middleware, with your custom options applied
 * Used as app.use(CKLogger({ options }));
 */
export const CKLogger = (options?: ICKLConfig): Middleware => {
  const config = mergeConfig(options);
  return (ctx: Context, next: Next) => CKL(config, ctx, next);
};

/**
 * Default export for Koa-ConsoleLogger
 * This provides a pre-configured middleware that you can just app.use(logger)
 */
export const logger = CKLogger();
export default logger;