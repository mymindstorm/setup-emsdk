import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';

async function run() {
  try {
    const emsdkArchive = await tc.downloadTool("https://github.com/emscripten-core/emsdk/archive/master.tar.gz");
    const emsdkFolder = await tc.extractTar(emsdkArchive);
    const emsdk = `${emsdkFolder}/emsdk-master/emsdk`

    await exec.exec(`${emsdk} install latest`);
    await exec.exec(`${emsdk} activate latest`);
    await exec.exec(`${emsdk} construct_env`, [], {listeners: {
      stdline(message) {
        const pathRegex = new RegExp(/PATH \+= (\S+)/)
        const pathResult = pathRegex.exec(message);

        if (pathResult) {
          core.addPath(pathResult[0]);
          core.debug(`Add path: ${pathResult[0]}`);
          return;
        }
        
        const envRegex = new RegExp(/(\S+) = (\S+)/);
        const envResult = envRegex.exec(message);

        if (envResult) {
          core.exportVariable(envResult[0], envResult[1]);
          core.debug(`Set env: ${envResult[0]} = ${envResult[1]}`);
          return;
        }
      }
    }})
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
