// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ArgumentParser, RawDescriptionHelpFormatter } from "argparse";
import { promises as fs } from "fs";
import path from "path";
import semver from "semver";

type PackageJson = {
  version?: string;
};

enum Command {
  setVersion = "set-version",
}

class PrettyError extends Error {}

const REPO_ROOT_PATH = path.join(__dirname, "..");

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const command = args.command as string;

  if (command === Command.setVersion) {
    const version = args.version as string;

    if (semver.valid(version) == undefined) {
      throw new PrettyError(`Invalid version: ${version}`);
    }

    return await recursiveUpdatePackageVersion(REPO_ROOT_PATH, version);
  }
}

function parseArgs(args: string[]) {
  const parser = new ArgumentParser({
    formatter_class: RawDescriptionHelpFormatter,
    description: `
    Studio version and release management script.
  
    Commands:
      ${Command.setVersion} - Set version number across all package.json files
    `.trim(),
  });
  const command_parser = parser.add_subparsers({ dest: "command", required: true });

  const version_command = command_parser.add_parser(Command.setVersion);
  version_command.add_argument("version", {
    type: String,
    help: "New version string",
  });

  // Show help if no args passed
  // First two argv are node interpreter and this script
  if (args.length === 0) {
    args.push("--help");
  }

  return parser.parse_args(args);
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
        // eslint-disable-next-line no-restricted-syntax
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

if (require.main === module) {
  main().catch((e) => {
    if (e instanceof PrettyError) {
      // no stack trace for expected errors
      console.error(e.message);
    } else {
      // unexpected error
      console.error(e);
    }
    process.exit(1);
  });
}
