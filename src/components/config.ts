import { nanoid } from 'nanoid';
import { ICKLConfig } from '../types/ICKLConfig';
import { ICKLParameters } from 'src/types/ICKLParameters';


const defaultOrder = [
  'deployId', 
  'method',
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

export const chalkColourMap: Record<keyof ICKLParameters, string> = {
  deployId: 'yellow',
  requestId: 'blue',
  method: 'bold',
  url: 'dim',
  break: 'green',
  time: 'dim',
  size: 'dim',
  errorMessage: 'red',
}

/* 
  The preset, default config that Koa Console Logger ships with
  Check the ICKLConfig type for what each option does
*/
export const defaultConfig = (): ICKLConfig => ({
  deployId: nanoid(3),
  stringify: true,
  chalk: true,
  order: defaultOrder,
  break: '~',
  errorDataKey: 'data',
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