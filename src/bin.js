#!/usr/bin/env node

import { spawnSync } from "child_process";
import { createHash } from "crypto";
import fs from "fs";
import { createRequire } from "module";
import path from "path";

const DIR_NAME = ".bb-hooks";

const MODE = 33261;

const DIR = path.resolve(process.cwd(), DIR_NAME);

const AVAILABLE_HOOKS = [
  "pre-commit",
  "prepare-commit-msg",
  "commit-msg",
  "post-commit",
  "pre-rebase",
];

function isFileExist(dir = DIR) {
  return fs.existsSync(dir);
}

function createDir(dir = DIR) {
  fs.mkdirSync(dir, { recursive: true });
}
function createShellContent(shell = "") {
  return `#!/bin/sh\n\necho ":) bb-hooks run..."\n\n${shell}`;
}
function createShell(name = "", shell = "") {
  if (isFileExist(path.resolve(DIR, name))) {
    fs.unlinkSync(path.resolve(DIR, name));
  }
  fs.writeFileSync(path.resolve(DIR, name), createShellContent(shell), {
    mode: MODE,
  });
}

function createShells(shellList = [], hooks = {}) {
  const hooksArr = Object.keys(hooks);
  shellList.forEach((hook) => {
    if (!hooksArr.includes(hook)) {
      fs.unlinkSync(path.resolve(DIR, hook));
    }
  });

  Object.keys(hooks).forEach((hook) => {
    AVAILABLE_HOOKS.includes(hook) &&
      !shellCompare(hook, hooks[hook]) &&
      createShell(hook, hooks[hook]);
  });
}

function checkExistShell() {
  let shells = [];
  const dirs = fs.readdirSync(DIR);
  dirs.forEach((dir) => {
    let f = path.resolve(DIR, dir);
    let stat = fs.statSync(f);
    if (stat.isFile) {
      shells.push(dir);
    } else {
      fs.unlinkSync(f);
    }
  });
  return shells;
}

function getShellMd5(content = "") {
  const md5 = createHash("md5");
  return md5.update(content).digest("hex");
}

function shellCompare(dir = "", shell = "") {
  if (isFileExist(path.resolve(DIR, dir))) {
    const state = fs.statSync(path.resolve(DIR, dir));
    if (state.mode !== MODE) {
      return false;
    }
    const buffer = fs.readFileSync(path.resolve(DIR, dir));
    const content = buffer.toString();
    const prevMd5 = getShellMd5(content);
    const nextMd5 = getShellMd5(createShellContent(shell));
    return prevMd5 === nextMd5;
  }
  return false;
}

function getHooks() {
  const config =
    createRequire(import.meta.url)(
      path.resolve(process.cwd(), "package.json"),
    ) || {};
  const pkg = createRequire(import.meta.url)("../package.json") || {};
  return [config["bb-hooks"] || {}, pkg["version"]];
}

function checkGit() {
  const { stderr, error } = spawnSync("git", ["version"]);
  return !(
    error ||
    stderr.length ||
    !isFileExist(path.resolve(process.cwd(), ".git"))
  );
}

function setGitHook() {
  let { output } = spawnSync("git", ["config", "--get", "core.hooksPath"]);

  if (output.length) {
    if (output.toString().indexOf(".bb-hooks") > -1) {
      return;
    } else {
      spawnSync("git", ["config", "core.hooksPath", ".bb-hooks"]);
      console.log(`========== Change core.hooksPath to .bb-hooks ============`);
    }
  }
}

function main() {
  if (!isFileExist()) {
    createDir();
  }

  const [hooks, version] = getHooks();

  Object.keys(hooks).length && createShells(checkExistShell(), hooks);

  setGitHook();

  console.log(`========== bb-hooks init! ==========`);
  console.log(`version: ${version}`);
}

checkGit() && main();
