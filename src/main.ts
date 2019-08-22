import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';

async function run() {
  try {
    const emsdkArchive = await tc.downloadTool("https://github.com/emscripten-core/emsdk/archive/master.tar.gz");
    const emsdkFolder = await tc.extractTar(emsdkArchive);
    await exec.exec(`python2.7 ${emsdkFolder}/emsdk install latest`);
    await exec.exec(`python2.7 ${emsdkFolder}/emsdk activate latest`);
    // await exec.exec(`source ${emsdkFolder}/emsdk_env.sh`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
