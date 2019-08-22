import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';
import { CodeGenerator } from '@babel/generator';

async function run() {
  try {
    const emsdkArchive = await tc.downloadTool("https://github.com/emscripten-core/emsdk/archive/master.tar.gz");
    const emsdkFolder = await tc.extractTar(emsdkArchive);
    const emsdk = `${emsdkFolder}/emsdk-master/emsdk`
    await exec.exec(emsdk, ["install latest",]);
    await exec.exec(emsdk, ["activate latest"]);
    await exec.exec(emsdk, ["construct_env"], {listeners: {
      stdline(e) {
        core.warning(e);
      }
    }})
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
