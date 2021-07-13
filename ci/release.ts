// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { promises as fs } from "fs";
import path from "path";

const REPO_ROOT_PATH = path.join(__dirname, "..");

type PackageJson = {
  version?: string;
};

async function main(): Promise<void> {
  await recursiveUpdatePackageVersion(REPO_ROOT_PATH, "0.13.0-foo");
  // fs.readdir(

  // Parse package.json
  //   const pkg = JSON.parse(await fs.readFile(REPO_ROOT_PATH, "utf8"));

  //   // Generate new package version
  //   const ver = (pkg.version as string).replace(/-.*$/, "");
  //   const sha = (await execOutput("git", ["rev-parse", "--short", "HEAD"])).trim();
  //   const date = new Date().toISOString().replace(/T.*$/, "").replace(/-/g, "");

  //   assert.ok(ver, "Missing package.json version");
  //   assert.ok(sha, "Missing git HEAD shortref");

  //   pkg.version = `${ver}-nightly.${date}.${sha}`;

  //   // Write package.json
  //   await fs.writeFile(PACKAGE_JSON_PATH, JSON.stringify(pkg, undefined, 2) + "\n", "utf8");
}

async function recursiveUpdatePackageVersion(dir: string, version: string) {
  const files = await fs.readdir(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);

    if (file.startsWith(".") || file === "node_modules") {
      // don't recurse into hidden directories or node_modules
    } else if ((await fs.stat(fullPath)).isDirectory()) {
      // recurse into directory
      await recursiveUpdatePackageVersion(fullPath, version);
    } else if (file === "package.json") {
      const pkg = JSON.parse(await fs.readFile(fullPath, "utf8")) as PackageJson;

      // update version if it exists in this package
      if (pkg.version != undefined && pkg.version !== "") {
        pkg.version = version;
        await fs.writeFile(fullPath, JSON.stringify(pkg, undefined, 2) + "\n", "utf8");
      }
    }
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
