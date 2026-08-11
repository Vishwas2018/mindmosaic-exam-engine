/**
 * Lets a Node script import a `server-only`-marked module.
 *
 * `@/server/exam-bank` opens with `import "server-only"`, whose default
 * build throws on load — that is the whole point of the marker: it makes
 * importing the bank (answer keys included) from a client bundle a build
 * error. Only the `react-server` export condition resolves it to a no-op,
 * and running Node with `--conditions=react-server` is not an option here:
 * it also switches React itself to its server build, which has no
 * `createContext`, so any client component reachable from the import graph
 * (`exam-patterns/components/**` is) dies on load.
 *
 * So this stubs exactly one specifier instead, for both the CJS and ESM
 * resolvers, and nothing else. It does not weaken the guarantee the marker
 * exists for: that guarantee is about what reaches a browser bundle, and
 * this is an offline audit script that ships nowhere.
 *
 * Import this module BEFORE any `server-only`-marked module. ES modules are
 * evaluated in import-declaration order, so a plain
 * `import "./lib/allow-server-only.mts";` placed above the others is enough.
 */

import { createRequire, register } from "node:module";

const STUBBED = new Set(["server-only", "client-only"]);

/* CJS: tsx currently loads the app's .ts/.tsx graph through require(). */
const require = createRequire(import.meta.url);
const CjsModule = require("node:module") as {
  _load: (request: string, parent: unknown, isMain: boolean) => unknown;
};
const loadCjs = CjsModule._load.bind(CjsModule);
CjsModule._load = (request, parent, isMain) =>
  STUBBED.has(request) ? {} : loadCjs(request, parent, isMain);

/* ESM: covers the same specifiers if the graph is ever loaded as real ESM. */
register(
  "data:text/javascript," +
    encodeURIComponent(
      `const stubbed = new Set(${JSON.stringify([...STUBBED])});
       export async function resolve(specifier, context, nextResolve) {
         if (!stubbed.has(specifier)) return nextResolve(specifier, context);
         return {
           url: "data:text/javascript,export%20default%20%7B%7D",
           format: "module",
           shortCircuit: true,
         };
       }`,
    ),
);
