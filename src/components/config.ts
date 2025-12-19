import { nanoid } from 'nanoid';
import { ICKLConfig } from '../types/ICKLConfig';


const defaultOrder = [
  'deployId', 
  'break',
  'requestId', 
  'flow', 
  'url', 
  'status',
  'time',
  'size',
  'break',
  'ip',
  'origin',
  'context',
  'errorMessage',
  'errorData',
];

/* 
  The preset, default config that Koa Console Logger ships with
  Check the ICKLConfig type for what each option does
*/
export const defaultConfig = (): ICKLConfig => ({
  deployId: nanoid(4),
  stringify: true,
  chalk: false,
  order: defaultOrder,
  break: '~',
  errorDataKey: 'log',
});

/**
 * Overlays our default config with the user-provided config
 */
export const mergeConfig = (options?: ICKLConfig) => {
  // Generate our default config
  let config = defaultConfig();
  if (!options) { 
    return config;
  }

  // Overlay options overtop of our default config
  config = { ...config, ...options };
  return config;
}