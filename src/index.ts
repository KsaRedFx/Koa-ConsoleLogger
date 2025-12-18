import { Context, Next } from "koa";

import { mergeConfig } from "./components/config";
import { ICKLConfig } from "./types/ICKLConfig";
import { logger as KCL } from "./components/logger";


/**
 * CKLogger creator
 * Returns a logger middleware, with your custom options applied
 * Used as app.use(CKLogger({ options }));
 */
export const CKLogger = async (options?: ICKLConfig) => {
  const config = mergeConfig(options);
  return (ctx: Context, next: Next) => KCL(config, ctx, next);
};

/**
 * Default export for Koa-ConsoleLogger
 * This provides a pre-configured middleware that you can just app.use(logger)
 */
export const logger = CKLogger();
export default logger;