import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test as standalone } from "@playwright/test";

import { test, expect, docker, image } from "../../fixtures";

test.use({ ignoreHTTPSErrors: true });

standalone(
  "runtime works with networking disabled and no development executables",
  async () => {
    const name = `monkey-offline-${randomUUID()}`;

    try {
      docker(
        "run",
        "--detach",
        "--name",
        name,
        "--network",
        "none",
        "--env",
        "MONKEY_PUBLIC_URL=https://localhost",
        "--env",
        "MONKEY_DATA_PATH=/data/offline",
        "--env",
        "MONKEY_DEFAULT_LOCALE=en-US",
        "--env",
        "MONKEY_LOG_LEVEL=Warning",
        image,
      );

      await expect
        .poll(
          () => {
            const check = spawnSync(
              "docker",
              [
                "exec",
                name,
                "node",
                "-e",
                "Promise.all(['/health/ready','/favicon.png','/assets/lucide/lucide.woff2','/assets/lucide/LICENSE','/about/build-info.json','/licenses/AGPL-3.0-only.txt','/licenses/THIRD-PARTY-NOTICES.txt','/'].map(path=>fetch('http://127.0.0.1:8080'+path))).then(responses=>process.exit(responses.every(response=>response.ok)?0:1)).catch(()=>process.exit(1))",
              ],
              { encoding: "utf8", timeout: 10_000 },
            );

            return check.status;
          },
          { timeout: 30_000, intervals: [100, 250, 500] },
        )
        .toBe(0);

      const notices = readFileSync(
        resolve(__dirname, "../../../../../THIRD-PARTY-NOTICES.txt"),
      );
      const noticeHash = docker(
        "exec",
        name,
        "node",
        "-e",
        "const {createHash}=require('node:crypto');fetch('http://127.0.0.1:8080/licenses/THIRD-PARTY-NOTICES.txt').then(response=>response.arrayBuffer()).then(bytes=>console.log(createHash('sha256').update(Buffer.from(bytes)).digest('hex'))).catch(()=>process.exit(1))",
      );

      expect(noticeHash.trim()).toBe(
        createHash("sha256").update(notices).digest("hex"),
      );

      const catalog: {
        coverage: string;
        releaseReview: string;
        entries: { id: string }[];
        documents: { id: string; sha256: string }[];
      } = JSON.parse(readFileSync(resolve(__dirname, "../../../../notices/catalog.json"), "utf8"));
      const mappedNotices = docker(
        "exec", name, "node", "-e",
        [
          "const {createHash}=require('node:crypto');const origin='http://127.0.0.1:8080';",
          "fetch(origin+'/about/third-party.json').then(async response=>{if(!response.ok)throw Error('Missing notice metadata');",
          "const data=await response.json();const documents=await Promise.all(data.documents.map(async document=>{",
          "const result=await fetch(origin+document.url);if(!result.ok)throw Error('Missing original document');",
          "const bytes=Buffer.from(await result.arrayBuffer());return [document.id,createHash('sha256').update(bytes).digest('hex')];}));",
          "console.log(JSON.stringify({coverage:data.coverage,releaseReview:data.releaseReview,entries:data.entries.map(entry=>entry.id),documents:Object.fromEntries(documents)}));",
          "}).catch(error=>{console.error(error.message);process.exit(1)});",
        ].join(""),
      );

      expect(JSON.parse(mappedNotices)).toEqual({
        coverage: catalog.coverage,
        releaseReview: catalog.releaseReview,
        entries: catalog.entries.map((entry) => entry.id),
        documents: Object.fromEntries(catalog.documents.map((document) => [document.id, document.sha256])),
      });

      const language = docker(
        "exec",
        name,
        "node",
        "-e",
        "fetch('http://127.0.0.1:8080/',{headers:{'Accept-Language':'en-US'}}).then(response=>response.text()).then(html=>process.exit(html.includes('lang=\"en\"')&&html.includes('Sign in')?0:1))",
      );

      expect(language).toBe("");

      expect(docker("logs", name)).not.toContain('"event":"listening"');

      expect(docker("exec", name, "dotnet", "--list-sdks")).toBe("");

      docker(
        "exec",
        name,
        "/bin/sh",
        "-c",
        "! command -v npm && ! command -v ng && ! command -v playwright",
      );
    } finally {
      docker("rm", "--force", "--volumes", name);
    }
  },
);

standalone(
  "Linux Node and .NET agree at DST boundaries with German/English globalization",
  async () => {
    const probe = resolve(
      __dirname,
      "../../../integration/RuntimeChecks/bin/Release/net10.0",
    );

    const result = JSON.parse(
      docker(
        "run",
        "--rm",
        "--network",
        "none",
        "--env",
        "TZ=Europe/Berlin",
        "--entrypoint",
        "/usr/bin/dotnet",
        "--mount",
        `type=bind,source=${probe},target=/probe,readonly`,
        image,
        "/probe/RuntimeChecks.dll",
      ),
    );

    expect(result.timezone).toBe("Europe/Berlin");

    expect(
      result.samples.map((sample: { local: string }) => sample.local),
    ).toEqual([
      "2026-03-29 01:59:59",
      "2026-03-29 03:00:00",
      "2026-10-25 02:59:59",
      "2026-10-25 02:00:00",
    ]);
    expect(
      result.samples.map(
        (sample: { offsetMinutes: number }) => sample.offsetMinutes,
      ),
    ).toEqual([60, 120, 120, 60]);

    expect(result.englishMonth).toBe("March");
    expect(result.englishDate).toBe("12/31/2026");
    expect(result.germanMonth).toBe("M\u00e4rz");

    const nodeSamples = JSON.parse(
      docker(
        "run",
        "--rm",
        "--network",
        "none",
        "--env",
        "TZ=Europe/Berlin",
        "--entrypoint",
        "/usr/local/bin/node",
        image,
        "-e",
        `const instants = ${JSON.stringify(result.samples.map((sample: { instant: string }) => sample.instant))};
    const format = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
     console.log(JSON.stringify(instants.map(instant => { const parts = Object.fromEntries(format.formatToParts(new Date(instant)).map(part => [part.type, part.value])); return parts.year+'-'+parts.month+'-'+parts.day+' '+parts.hour+':'+parts.minute+':'+parts.second; })));`,
      ),
    );

    expect(nodeSamples).toEqual(
      result.samples.map((sample: { local: string }) => sample.local),
    );
  },
);
