import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';

async function run() {
  try {
    const emArgs = {
      version: await core.getInput("version"),
      noInstall: await core.getInput("no-install"),
      noCache: await core.getInput("no-cache")
    };

    let emsdkFolder;
    let foundInCache = false;

    if (emArgs.version !== "latest" && emArgs.noCache === "false") {
      emsdkFolder = tc.find('emsdk', emArgs.version);
    } 

    if (!emsdkFolder) {
      const emsdkArchive = await tc.downloadTool("https://github.com/emscripten-core/emsdk/archive/master.zip");
      emsdkFolder = await tc.extractZip(emsdkArchive);
    } else {
      foundInCache = true;
    }

    const emsdk = `${emsdkFolder}/emsdk-master/emsdk`

    if (emArgs.noInstall === "true") {
      core.addPath(`${emsdkFolder}/emsdk-master`);
      core.exportVariable("EMSDK", `${emsdkFolder}/emsdk-master`);
      return;
    }

    if (!foundInCache) {
      await exec.exec(`${emsdk} install ${emArgs.version}`);
    }

    await exec.exec(`${emsdk} activate ${emArgs.version}`);
    await exec.exec(`${emsdk} construct_env`, [], {listeners: {
      stdline(message) {
        const pathRegex = new RegExp(/PATH \+= (\S+)/)
        const pathResult = pathRegex.exec(message);

        if (pathResult) {
          core.addPath(pathResult[1]);
          return;
        }
        
        const envRegex = new RegExp(/(\S+) = (\S+)/);
        const envResult = envRegex.exec(message);

        if (envResult) {
          core.exportVariable(envResult[1], envResult[2]);
          return;
        }
      }
    }})
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
