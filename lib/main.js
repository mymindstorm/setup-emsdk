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
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const emsdkArchive = yield tc.downloadTool("https://github.com/emscripten-core/emsdk/archive/master.tar.gz");
            const emsdkFolder = yield tc.extractTar(emsdkArchive);
            yield exec.exec(`${emsdkFolder}/emsdk-master/emsdk install latest`);
            yield exec.exec(`${emsdkFolder}/emsdk-master/emsdk activate latest`);
            // await exec.exec(`source ${emsdkFolder}/emsdk_env.sh`);
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
