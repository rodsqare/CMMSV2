
RUN npm install && npm run build && npm run init-db
42s
npm warn config production Use `--omit=dev` instead.
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE   package: '@supabase/auth-js@2.93.3',
npm warn EBADENGINE   required: { node: '>=20.0.0' },
npm warn EBADENGINE   current: { node: 'v18.20.5', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE   package: '@supabase/functions-js@2.93.3',
npm warn EBADENGINE   required: { node: '>=20.0.0' },
npm warn EBADENGINE   current: { node: 'v18.20.5', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE   package: '@supabase/postgrest-js@2.93.3',
npm warn EBADENGINE   required: { node: '>=20.0.0' },
npm warn EBADENGINE   current: { node: 'v18.20.5', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE   package: '@supabase/realtime-js@2.93.3',
npm warn EBADENGINE   required: { node: '>=20.0.0' },
npm warn EBADENGINE   current: { node: 'v18.20.5', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE   package: '@supabase/storage-js@2.93.3',
npm warn EBADENGINE   required: { node: '>=20.0.0' },
npm warn EBADENGINE   current: { node: 'v18.20.5', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE   package: '@supabase/supabase-js@2.93.3',
npm warn EBADENGINE   required: { node: '>=20.0.0' },
npm warn EBADENGINE   current: { node: 'v18.20.5', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE   package: 'iceberg-js@0.8.1',
npm warn EBADENGINE   required: { node: '>=20.0.0' },
npm warn EBADENGINE   current: { node: 'v18.20.5', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm warn deprecated @humanwhocodes/config-array@0.13.0: Use @eslint/config-array instead
npm warn deprecated @humanwhocodes/object-schema@2.0.3: Use @eslint/object-schema instead
npm warn deprecated eslint@8.57.1: This version is no longer supported. Please see https://eslint.org/version-support for other options.
added 464 packages, changed 87 packages, and audited 552 packages in 16s
153 packages are looking for funding
  run `npm fund` for details
2 moderate severity vulnerabilities
To address all issues (including breaking changes), run:
  npm audit fix --force
Run `npm audit` for details.
npm warn config production Use `--omit=dev` instead.
> cmmsbiomedico@0.1.0 build
> next build
 ⚠ Invalid next.config.js options detected: 
 ⚠     Unrecognized key(s) in object: 'swcMinify'
 ⚠ See more info here: https://nextjs.org/docs/messages/invalid-next-config
Attention: Next.js now collects completely anonymous telemetry regarding usage.
This information is used to shape Next.js' roadmap and prioritize features.
You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
https://nextjs.org/telemetry
   ▲ Next.js 15.5.11
   Creating an optimized production build ...
 ⚠ Mismatching @next/swc version, detected: 15.5.7 while Next.js is on 15.5.11. Please ensure these match
 ⚠ Mismatching @next/swc version, detected: 15.5.7 while Next.js is on 15.5.11. Please ensure these match
 ⚠ Mismatching @next/swc version, detected: 15.5.7 while Next.js is on 15.5.11. Please ensure these match
 ✓ Compiled successfully in 15.7s
   Linting and checking validity of types ...
Failed to compile.
./app/page.tsx:5131:21
Type error: Property 'filter' does not exist on type 'any[] | { equipos: any[]; mantenimientos: any[]; }'.

  Property 'filter' does not exist on type '{ equipos: any[]; mantenimientos: any[]; }'.
  5129 |
  5130 |       if (reportType !== "cronograma" && (reportFechaInicio || reportFechaFin)) {
> 5131 |         data = data.filter((item) => {
       |                     ^
  5132 |           // Find the relevant date field in the item
  5133 |           const itemDateString =
  5134 |             item.proximaFecha || // For Mantenimientos
Next.js build worker exited with code: 1 and signal: null