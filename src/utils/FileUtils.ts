import fs from "fs";
import path from "path";
import Logger from "./logger";

const logger = Logger.getLogger();

export class FileUtils {
    public static readonly FILE_FILTER = {
        ignores: ['.git', '.preview', '.hvigor', '.idea', 'test', 'ohosTest'],
        include: /(?<!\.d)\.(ets|ts|json5)$/
    }

    public static getFilesRecursively(srcPath: string, files: string[]) {
        if (!fs.existsSync(srcPath)) {
            logger.warn(`Input directory ${srcPath} is not exist`);
            return;
        }

        const filesUnderThisDir = fs.readdirSync(srcPath, {withFileTypes: true});
        filesUnderThisDir.forEach(file => {
            const realFile = path.resolve(srcPath, file.name);
            if (file.isDirectory() && (!FileUtils.FILE_FILTER.ignores.includes(file.name))) {
                FileUtils.getFilesRecursively(realFile, files);
            } else if ((path.basename(realFile).match(FileUtils.FILE_FILTER.include))) {
                files.push(realFile);
            }
        });
    }
}