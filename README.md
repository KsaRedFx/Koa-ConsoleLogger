# Koa Console Logger

Koa Console Logger! A lightweight middleware for Koa (v2+) that prints structured HTTP request/response logs to the console/stdout. It helps monitor HTTP traffic and errors with useful metadata such as response time in microseconds, response size, request ids, deployment ids, flow information and custom context or error fields.

- Works with Koa 2+
- Logs errors and successful requests
- Response time in microseconds
- Response size reporting
- Request id and deployment id support
- Custom parameter functions
- Extra context via `ctx.state.cklcontext`
- Extra error fields via `Error.log` (configurable key)

## Install

npm
```bash
npm install koa-consolelogger
```


## Quick start
Default logger:
```js
import Koa from 'koa';
import logger from 'koa-consolelogger';

const app = new Koa();
app.use(logger); // default middleware
```


Custom configuration:
```js
import Koa from 'koa';
import { CKLogger } from 'koa-consolelogger';

const config = {
  deploymentId: 'prod-1',
  errorDataKey: 'data' // reads Error.data for extra error fields instead of Error.log
};

const logger = CKLogger(config);
const app = new Koa();
app.use(logger);
```

## Configuration options
The library reads its runtime options from the ICKLConfig interface. Below are the option names and what they do (use when calling CKLogger(config) or when creating a custom logger).

- deployId?: string  
  Optional deployment identifier included on every log. If not set a random id is generated per logger instance.

- stringify?: boolean  
  Optional. Not enabled yet! When extra context or error fields are objects, should they be JSON.stringified before being included in logs.

- chalk?: boolean  
  Optional. Not enabled yet! Controls colored output. Set to false to disable colors.

- break?: string  
  Optional. Separator character used between log parts. Default: '~'.

- order?: Array<keyof ICKLParameters>  
  Optional. Controls the order of fields printed for each request. Keys must match properties from ICKLParameters. If you create your own parameters function you'll have to extend this type

- errorDataKey?: string  
  Optional. Name of the property on Error instances that holds extra error fields (default: `log`). The logger will read `Error[config.errorDataKey]` if present.

- extraParamsFn?: TCKLParamsFn  
  Optional. A function to compute or augment extra parameters for each log entry
  These parameters will be added on top of any pre-generated parameters, so that means they're completely overridable!
  Example:
  ```js
  const extraParamsFn = (ctx, config, err, params) => {
    return { tenant: ctx.state?.tenant || 'unknown' };
  };
  app.use(CKLogger({ extraParamsFn }));
  ```

Notes:
- All options are optional; unspecified fields fall back to the library's internal defaults (eg: deployId is generated when not supplied).
- For extra request context use ctx.state.cklogger, or use your own custom extraParamsFn
- Koa automatically adds the 3rd parameter of `ctx.throw()` to the `Error` object if you provide it as an object! Just set your extra data in `{ log: ... }`


## Context & Error fields
- Add extra context for a request via `ctx.state.cklcontext`:
```js
app.use(async (ctx, next) => {
  ctx.state.cklcontext = { tenant: 'acme', userId: 42 };
  ctx.body = 'Hello world!';
});
```

- Add extra fields to errors using `ctx.throw()`:
Koa's throw will include data in an error if it's the 3rd parameter, and an object.
By default the logger will look for `Error.log` but this can be configured via `errorDataKey`
```js
ctx.throw(401, 'Unauthorized', { log: { ... }});
```


## Contributing
Contributions welcome. Please open issues or PRs.


## License
MIT