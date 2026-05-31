import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { openApiDocument } from "@/lib/openapi";

async function main() {
  const docsDir = path.join(process.cwd(), "docs");
  await mkdir(docsDir, { recursive: true });
  await writeFile(path.join(docsDir, "openapi.json"), `${JSON.stringify(openApiDocument, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

