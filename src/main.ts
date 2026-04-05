import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as tc from "@actions/tool-cache";
import * as cache from "@actions/cache";
import * as io from "@actions/io";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import { envRegex, pathRegex } from "./matchers.js";

async function run() {
  try {
    const emArgs = {
      version: core.getInput("version"),
      emsdkVersion: core.getInput("emsdk-version"),
      noInstall: core.getBooleanInput("no-install"),
      noCache: core.getBooleanInput("no-cache"),
      actionsCacheFolder: core.getInput("actions-cache-folder"),
      cacheKey: core.getInput("cache-key"),
      // XXX: update-tags is deprecated and used for backwards compatibility.
      update:
        core.getBooleanInput("update") || core.getBooleanInput("update-tags"),
    };

    let emsdkVersionToUse = emArgs.emsdkVersion;
    if (!emsdkVersionToUse) {
      if (emArgs.version === "latest" || emArgs.version === "tot") {
        emsdkVersionToUse = "main";
      } else {
        emsdkVersionToUse = emArgs.version;
      }
    }

    let emsdkFolder;
    let foundInCache = false;

    const combinedVersion =
      emsdkVersionToUse === emArgs.version
        ? emsdkVersionToUse
        : `${emsdkVersionToUse}-${emArgs.version}`;

    if (
      emsdkVersionToUse !== "main" &&
      emArgs.version !== "latest" &&
      emArgs.version !== "tot" &&
      !emArgs.noCache &&
      !emArgs.actionsCacheFolder
    ) {
      emsdkFolder = tc.find("emsdk", combinedVersion, os.arch());
    }

    const cacheKey =
      emArgs.cacheKey ||
      `${process.env.GITHUB_WORKFLOW}-${combinedVersion}-${os.platform()}-${os.arch()}`;
    if (emArgs.actionsCacheFolder && process.env.GITHUB_WORKSPACE) {
      const fullCachePath = path.join(
        process.env.GITHUB_WORKSPACE,
        emArgs.actionsCacheFolder,
      );
      try {
        try {
          fs.accessSync(
            path.join(fullCachePath, "emsdk-main", "emsdk"),
            fs.constants.X_OK,
          );
        } catch {
          await cache.restoreCache([emArgs.actionsCacheFolder], cacheKey);
        }
        fs.accessSync(
          path.join(fullCachePath, "emsdk-main", "emsdk"),
          fs.constants.X_OK,
        );
        emsdkFolder = fullCachePath;
        foundInCache = true;
      } catch {
        core.warning(
          `No cached files found at path "${fullCachePath}" - downloading and caching emsdk.`,
        );
        await io.rmRF(fullCachePath);
        // core.debug(fs.readdirSync(fullCachePath + '/emsdk-main').toString());
      }
    }

    if (!emsdkFolder) {
      const emsdkArchive = await tc.downloadTool(
        `https://github.com/emscripten-core/emsdk/archive/${emsdkVersionToUse}.zip`,
      );
      emsdkFolder = await tc.extractZip(emsdkArchive);
      if (emsdkVersionToUse !== "main") {
        await io.mv(
          path.join(emsdkFolder, `emsdk-${emsdkVersionToUse}`),
          path.join(emsdkFolder, "emsdk-main"),
        );
      }
    } else {
      foundInCache = true;
    }

    let emsdk = path.join(emsdkFolder, "emsdk-main", "emsdk");

    if (os.platform() === "win32") {
      emsdk = `powershell ${path.join(emsdkFolder, "emsdk-main", "emsdk.ps1")}`;
    }

    if (emArgs.noInstall) {
      core.addPath(path.join(emsdkFolder, "emsdk-main"));
      core.exportVariable("EMSDK", path.join(emsdkFolder, "emsdk-main"));
      return;
    }

    if (!foundInCache) {
      if (emArgs.update) {
        await exec.exec(`${emsdk} update`);
      }

      await exec.exec(`${emsdk} install ${emArgs.version}`);

      if (
        emsdkVersionToUse !== "main" &&
        emArgs.version !== "latest" &&
        emArgs.version !== "tot" &&
        !emArgs.noCache &&
        !emArgs.actionsCacheFolder
      ) {
        await tc.cacheDir(emsdkFolder, "emsdk", combinedVersion, os.arch());
      }
    }

    await exec.exec(`${emsdk} activate ${emArgs.version}`);
    const envListener = (message) => {
      const pathResult = pathRegex.exec(message);

      if (pathResult) {
        core.addPath(pathResult[1]);
        return;
      }

      const envResult = envRegex.exec(message);

      if (envResult) {
        core.exportVariable(envResult[1], envResult[2]);
        return;
      }
    };
    await exec.exec(`${emsdk} construct_env`, [], {
      listeners: { stdline: envListener, errline: envListener },
    });

    if (
      emArgs.actionsCacheFolder &&
      !foundInCache &&
      process.env.GITHUB_WORKSPACE
    ) {
      fs.mkdirSync(
        path.join(process.env.GITHUB_WORKSPACE, emArgs.actionsCacheFolder),
        { recursive: true },
      );
      await io.cp(
        path.join(emsdkFolder, "emsdk-main"),
        path.join(process.env.GITHUB_WORKSPACE, emArgs.actionsCacheFolder),
        { recursive: true },
      );
      await cache.saveCache([emArgs.actionsCacheFolder], cacheKey);
    }
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      (typeof error.message === "string" || error.message instanceof Error)
    ) {
      core.setFailed(error.message);
    }
  }
}

run();
