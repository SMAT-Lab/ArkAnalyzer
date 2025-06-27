import * as fs from 'fs';
import * as path from 'path';

export function findProjectRoot(startDIr: string = __dirname): string {
    let dir = path.resolve(startDIr);
    while (true) {
        if (fs.existsSync(path.join(dir, 'package.json'))) {
            return dir;
        }
        const parentDIr = path.dirname(dir);
        if (parentDIr === dir) {
            return dir;
        }
        dir = parentDIr;
    }
}

const projectRoot = findProjectRoot(__dirname);

function getPrintAstExePath():string {
    let printAstExePath = path.join(projectRoot, 'src','ast','arkCppAstDumper.exe');
    if (!fs.existsSync(printAstExePath)) {
        printAstExePath = path.join(projectRoot, 'lib','ast','arkCppAstDumper.exe');
    }
    return printAstExePath;
}

const printAstExePath = getPrintAstExePath()

export class ClangPath {
    static WindowsPath = printAstExePath;
    static LinuxPath = "";
    static Unknown = "";
    static protectRoot = projectRoot;
}


