import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), ".env.local");
if (fs.existsSync(file)) for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
  const index = line.indexOf("="); if (index <= 0 || line.startsWith("#")) continue;
  const name = line.slice(0,index); if (process.env[name] === undefined) process.env[name] = line.slice(index+1);
}
