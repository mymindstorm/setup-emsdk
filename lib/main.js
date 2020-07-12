"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const tc = __importStar(require("@actions/tool-cache"));
const cache = __importStar(require("@actions/cache"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const emArgs = {
                version: yield core.getInput("version"),
                noInstall: yield core.getInput("no-install"),
                noCache: yield core.getInput("no-cache"),
                actionsCacheFolder: yield core.getInput("actions-cache-folder"),
                updateTags: yield core.getInput("update-tags")
            };
            let emsdkFolder;
            let foundInCache = false;
            if (emArgs.version !== "latest" && emArgs.noCache === "false" && !emArgs.actionsCacheFolder) {
                emsdkFolder = yield tc.find('emsdk', emArgs.version, os.arch());
            }
            const cacheKey = `${emArgs.version}-${os.arch()}`;
            if (emArgs.actionsCacheFolder) {
                const fullCachePath = `${process.env.GITHUB_WORKSPACE}/${emArgs.actionsCacheFolder}`;
                try {
                    yield cache.restoreCache([emArgs.actionsCacheFolder], cacheKey);
                    fs.accessSync(fullCachePath + '/emsdk-master/emsdk', fs.constants.X_OK);
                    emsdkFolder = fullCachePath;
                    foundInCache = true;
                }
                catch (e) {
                    core.warning(`No cached files found at path "${fullCachePath}" - downloading and caching emsdk.`);
                    yield exec.exec(`rm -rf ${fullCachePath}`);
                    // core.debug(fs.readdirSync(fullCachePath + '/emsdk-master').toString());
                }
            }
            if (!emsdkFolder) {
                const emsdkArchive = yield tc.downloadTool("https://github.com/emscripten-core/emsdk/archive/master.zip");
                emsdkFolder = yield tc.extractZip(emsdkArchive);
            }
            else {
                foundInCache = true;
            }
            let emsdk = `${emsdkFolder}/emsdk-master/emsdk`;
            if (os.platform() === "win32") {
                emsdk = `powershell ${emsdkFolder}\\emsdk-master\\emsdk.ps1`;
            }
            if (emArgs.noInstall === "true") {
                if (os.platform() === "win32") {
                    core.addPath(`${emsdkFolder}\\emsdk-master`);
                    core.exportVariable("EMSDK", `${emsdkFolder}\\emsdk-master`);
                }
                else {
                    core.addPath(`${emsdkFolder}/emsdk-master`);
                    core.exportVariable("EMSDK", `${emsdkFolder}/emsdk-master`);
                }
                return;
            }
            if (!foundInCache) {
                if (emArgs.updateTags) {
                    yield exec.exec(`${emsdk} update-tags`);
                }
                yield exec.exec(`${emsdk} install ${emArgs.version}`);
                if (emArgs.version !== "latest" && emArgs.version !== "tot" && emArgs.noCache === "false" && !emArgs.actionsCacheFolder) {
                    yield tc.cacheDir(emsdkFolder, 'emsdk', emArgs.version, os.arch());
                }
            }
            yield exec.exec(`${emsdk} activate ${emArgs.version}`);
            const envListener = (message) => {
                const pathRegex = new RegExp(/PATH \+= (\S+)/);
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
            };
            yield exec.exec(`${emsdk} construct_env`, [], { listeners: { stdline: envListener, errline: envListener } });
            if (emArgs.actionsCacheFolder && !foundInCache) {
                fs.mkdirSync(`${process.env.GITHUB_WORKSPACE}/${emArgs.actionsCacheFolder}`, { recursive: true });
                yield exec.exec(`cp -r ${emsdkFolder}/emsdk-master ${process.env.GITHUB_WORKSPACE}/${emArgs.actionsCacheFolder}`);
                yield cache.saveCache([emArgs.actionsCacheFolder], cacheKey);
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
