import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { toJSONSchema } from "zod";
import { canonicalQuestionRevisionSchema } from "../src/features/content-platform/contracts";

const target = resolve("schemas/mindmosaic-question-revision-v2.schema.json");
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(toJSONSchema(canonicalQuestionRevisionSchema, { target: "draft-2020-12" }), null, 2)}\n`);
console.log(target);
