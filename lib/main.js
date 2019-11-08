"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const tc = __importStar(require("@actions/tool-cache"));
const os = __importStar(require("os"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const emArgs = {
                version: yield core.getInput("version"),
                noInstall: yield core.getInput("no-install"),
                noCache: yield core.getInput("no-cache"),
                storeActionsCache: yield core.getInput("store-actions-cache"),
                actionsCacheFolder: yield core.getInput("actions-cache-folder")
            };
            let emsdkFolder;
            let foundInCache = false;
            if (emArgs.version !== "latest" && emArgs.noCache === "false") {
                emsdkFolder = yield tc.find('emsdk', emArgs.version, os.arch());
            }
            if (emArgs.actionsCacheFolder) {
                emsdkFolder = emArgs.actionsCacheFolder;
                exec.exec("echo $GITHUB_WORKSPACE");
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
                yield exec.exec(`${emsdk} install ${emArgs.version}`);
                if (emArgs.version !== "latest" && emArgs.noCache === "false") {
                    yield tc.cacheDir(emsdkFolder, 'emsdk', emArgs.version, os.arch());
                }
            }
            yield exec.exec(`${emsdk} activate ${emArgs.version}`);
            yield exec.exec(`${emsdk} construct_env`, [], { listeners: {
                    stdline(message) {
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
                    }
                } });
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
