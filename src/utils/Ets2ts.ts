import * as path from 'path';
import * as fs from 'fs';
import * as url from 'url';
import * as crypto from 'crypto';
import Logger, { LOG_LEVEL } from "./logger";
import { fetchDependenciesFromFile, parseJsonText } from './json5parser';

const logger = Logger.getLogger();

enum FileType {
    ETS = 0,
    TS = 1
}

const CONFIG = {
    ignores: ['.git', '.preview', '.hvigor', '.idea', 'test', 'ohosTest'],
    include: /(?<!\.d)\.(ets|ts|json5)$/
}

interface CacheItem {
    srcHash: string;
    dstFile: string;
    dstHash: string;
}

interface CacheFile {
    versionCode: number;
    files: Map<string, CacheItem>;
}

class Ets2tsCache {
    cacheFilePath: string;
    versionCode: number = 1;
    cache: CacheFile;
    hashCache: Map<string, string> = new Map();

    constructor(projectPath:string, saveTsPath: string, cachePath: string) {
        this.cacheFilePath = path.join(cachePath, this.sha256(`${projectPath}:${saveTsPath}`));
        if (!fs.existsSync(cachePath)) {
            fs.mkdirSync(cachePath, {recursive: true});
        }
        this.loadCache();
    }

    public filesHasModify(files: string[]): boolean {
        if (!files) {
            return false;
        }
        for (const file of files) {
            if (this.oneFileHasModify(file)) {
                return true;
            }
        }
        return false;
    }

    public oneFileHasModify(srcFile: string): boolean {
        let files: Map<string, CacheItem> = this.cache.files;
        if (!files.has(srcFile)) {
            return true;
        }

        let item: CacheItem = this.cache.files.get(srcFile) as CacheItem;
        if (!fs.existsSync(item.dstFile)) {
            return true;
        }

        if (item.srcHash == this.shaFile(srcFile) && item.dstHash == this.shaFile(item.dstFile)) {
            return false;
        }

        return true;
    }

    public updateCache(srcFile: string, dstFile: string) {
        this.cache.files.set(srcFile, {srcHash: this.shaFile(srcFile), dstFile: dstFile, dstHash: this.shaFile(dstFile)});
    }

    public saveCache() {
        let obj = new Object();
        for (const [k, v] of this.cache.files) {
            //@ts-ignore
            obj[k] = v;
        }
        //@ts-ignore
        this.cache.files = obj;
        fs.writeFileSync(this.cacheFilePath, JSON.stringify(this.cache));
    }

    private loadCache() {
        if (fs.existsSync(this.cacheFilePath)) {
            this.cache = JSON.parse(fs.readFileSync(this.cacheFilePath, 'utf-8')) as CacheFile;
            if (this.cache.versionCode != this.versionCode) {
                this.cache = {versionCode: this.versionCode, files: new Map()};
            } else {
                this.cache.files = new Map(Object.entries(this.cache.files));
            }
        } else {
            this.cache = {versionCode: this.versionCode, files: new Map()};
        }
    }

    private sha256(content: string): string {
        let sha256 = crypto.createHash('sha256');
        sha256.update(content);
        return sha256.digest('hex');
    }

    private shaFile(file: string): string {
        if (this.hashCache.has(file)) {
            return this.hashCache.get(file) as string;
        }
        let hash = this.sha256(fs.readFileSync(file, 'utf-8'));
        if (file.endsWith('oh-package.json5')) {
            this.hashCache.set(file, hash);
        }
        return hash;
    }
}

/**
 *  let ets2ts = new Ets2ts();
 *  await ets2ts.init(etsLoaderPath, projectPath, output);
 *  await ets2ts.compileProject();
 */
export class Ets2ts {
    processUIModule: any;
    tsModule: any;
    etsCheckerModule: any;
    preProcessModule: Function;

    compilerOptions: any;
    projectConfig: any;
    resourcePath: string;
    ohPkgContentMap: Map<string, Object>;

    statistics: Array<Array<number>> = [[0, 0], [0, 0]];
    cache: Ets2tsCache;

    public async init(etsLoaderPath: string, projectPath: string, output: string, projectName: string) {
        this.tsModule = await require(path.join(etsLoaderPath, 'node_modules/typescript'));
        this.processUIModule = await require(path.join(etsLoaderPath, 'lib/process_ui_syntax'));
        this.preProcessModule = await require(path.join(etsLoaderPath, 'lib/pre_process.js'));
        this.etsCheckerModule =  await require(path.join(etsLoaderPath, 'lib/ets_checker'));
        this.compilerOptions = this.tsModule.readConfigFile(
            path.resolve(etsLoaderPath, 'tsconfig.json'), this.tsModule.sys.readFile).config.compilerOptions;
        this.compilerOptions.target = 'ESNext';
        this.compilerOptions.sourceMap = false;

        let mainModule = await require(path.join(etsLoaderPath, 'main'));
        mainModule.partialUpdateConfig.partialUpdateMode = true;
        this.projectConfig = mainModule.projectConfig;
        this.projectConfig.projectPath = path.resolve(projectPath);
        this.projectConfig.cachePath = path.resolve(output, '.cache');
        this.projectConfig.saveTsPath = path.resolve(output, projectName);
        this.projectConfig.buildMode = "release";
        this.projectConfig.projectRootPath = ".";
        this.resolveSdkApi();
        
        let languageService = this.etsCheckerModule.createLanguageService([]);
        if (languageService.getBuilderProgram) {
            mainModule.globalProgram.builderProgram = languageService.getBuilderProgram(/*withLinterProgram*/ true);
            mainModule.globalProgram.program = mainModule.globalProgram.builderProgram.getProgram();
            mainModule.globalProgram.checker = mainModule.globalProgram.program.getTypeChecker();
        } else {
            mainModule.globalProgram.program = languageService.getProgram();
            mainModule.globalProgram.checker = mainModule.globalProgram.program.getTypeChecker();
        }

        this.ohPkgContentMap = new Map();
        this.cache = new Ets2tsCache(this.projectConfig.projectPath, this.projectConfig.saveTsPath, this.projectConfig.cachePath);
    }

    public async compileProject() {
        process.env.rawFileResource = './';
        process.env.compileMode = 'moduleJson';
        process.env.compiler = 'on';
        logger.info('Ets2ts-getAllEts start');
        let sources: Map<string, string[]> = new Map();
        if (this.getAllEts(this.projectConfig.projectPath, sources)) {
            this.mkOutputPath(this.projectConfig.projectPath);
        }
        logger.info('Ets2ts-getAllEts done');
        sources.forEach((value, key) => {
            let dstFile = this.getOutputPath(key);
            if (dstFile.endsWith('.ets')) {
                dstFile = dstFile.replace(/\.ets$/, '.ts');
            }

            if (key.endsWith('.ets')) {
                if (this.cache.oneFileHasModify(key) || this.cache.filesHasModify(value)) {
                    this.compileEts(key, value);
                    this.cache.updateCache(key, dstFile);
                    logger.info(`compile ${key}`);
                }
            } else {
                if (this.cache.oneFileHasModify(key) ) {
                    this.cp2output(key);
                    this.cache.updateCache(key, dstFile);
                }
            }
        })
        this.cache.saveCache();

        logger.info(`Ets2ts-compileEtsTime: ${this.statistics[0][1] / 1000}s, cnt: ${this.statistics[0][0]}, avg time: ${this.statistics[0][1] / this.statistics[0][0]}ms`);
        logger.info(`Ets2ts-copyTsTime: ${this.statistics[1][1] / 1000}s, cnt: ${this.statistics[1][0]}, avg time: ${this.statistics[1][1] / this.statistics[1][0]}ms`);
    }

    public emitWarning(msg: string) {
        logger.warn(msg);
    }

    public emitError(msg: string) {
        logger.error(msg);
    }

    private compileEts(file: string, ohPkgFiles: string[]) {
        this.resourcePath = file;
        let start = new Date().getTime();
        let alias: string = '';

        let dependenciesMap: Map<string, string> = new Map();
        for (let pkgFile of ohPkgFiles) {
            if (!this.ohPkgContentMap.has(pkgFile)) {
                this.ohPkgContentMap.set(pkgFile, fetchDependenciesFromFile(pkgFile));
            }
            let pkg = this.ohPkgContentMap.get(pkgFile);
            if (pkg && pkg.hasOwnProperty('dependencies')) {
                // @ts-ignore
                let dependencies = pkg.dependencies;
                Object.entries(dependencies).forEach((k, v) => {
                    let relativePath = url.parse(k[1] as string).path;
                    if (relativePath) {
                        let resolvePath = path.resolve(path.join(path.dirname(pkgFile), relativePath)).replace(new RegExp('\\' + path.sep, 'g'), '/');
                        dependenciesMap.set(k[0], resolvePath);
                        if (alias == '') {
                            alias = k[0];
                        } else {
                            alias += '|' + k[0];
                        }
                    }                    
                });
            }
        }
        let fileContent: string | undefined = fs.readFileSync(file, 'utf8');
        if (alias.length > 0) {
            const REG_IMPORT_DECL: RegExp = new RegExp('(import)\\s+(?:(.+)|\\{([\\s\\S]+)\\})\\s+from\\s+[\'\"]('+ alias +')(\\S+)[\'\"]', 'g');
            fileContent = fileContent.replace(REG_IMPORT_DECL, (substring: string, ...args: any[]) => {
                if (dependenciesMap.has(args[3])) {
                    return substring.replace(args[3], dependenciesMap.get(args[3]) as string);
                }
                return substring;
            });
        }

        this.preProcessModule(fileContent);
        this.tsModule.transpileModule(fileContent, {
            compilerOptions: this.compilerOptions,
            fileName: `${file}`,
            transformers: {before: [this.processUIModule.processUISyntax(null, false), this.getDumpSourceTransformer(this, dependenciesMap)]}
        });
        fileContent = undefined;
        let end = new Date().getTime();
        this.statistics[FileType.ETS][0]++;
        this.statistics[FileType.ETS][1] += end - start;
    }

    private mkOutputPath(filePath: string) {
        let resultPath = this.getOutputPath(filePath);
        fs.mkdirSync(resultPath, {recursive: true});
    }

    private getOutputPath(fileName: string): string {
        let relativePath = path.relative(this.projectConfig.projectPath, fileName);
        return path.join(this.projectConfig.saveTsPath, relativePath);
    }

    private cp2output(fileName: string) {
        let start = new Date().getTime();

        let resultPath = this.getOutputPath(fileName);
        fs.cpSync(fileName, resultPath);

        let end = new Date().getTime();
        this.statistics[FileType.TS][0]++;
        this.statistics[FileType.TS][1] += end - start;
    }

    private getAllEts(srcPath: string, ets: Map<string, string[]>, ohPkgFiles: string[] = []): boolean {
        let hasFile = false;

        let files = fs.readdirSync(srcPath, { withFileTypes: true });

        let ohPkgFilesOfThisDir: string[] = [];
        ohPkgFilesOfThisDir.push(...ohPkgFiles);

        for (let file of files) {
            if (file.name == 'oh-package.json5') {
                ohPkgFilesOfThisDir.push(path.resolve(srcPath, file.name));
                break;
            }
        }

        files.forEach(file => {
            const realFile = path.resolve(srcPath, file.name);
            if (file.isDirectory() && (!CONFIG.ignores.includes(file.name))) {
                if (this.getAllEts(realFile, ets, ohPkgFilesOfThisDir)) {
                    hasFile = true;
                    this.mkOutputPath(realFile);
                }
            } else {
                if ((path.basename(realFile).match(CONFIG.include))) {
                    ets.set(realFile, ohPkgFilesOfThisDir);
                    hasFile = true;
                }
            }
        });
        return hasFile;
    }

    getDumpSourceTransformer(ets2ts: Ets2ts, dependenciesMap: Map<string, string>): Function {
        // @ts-ignore
        return (context) => {
            // @ts-ignore
            function genContentAndSourceMapInfo(node): { content: string, sourceMapJson: string } {
                const printer = ets2ts.tsModule.createPrinter({newLine: ets2ts.tsModule.NewLineKind.LineFeed});
                const options = {
                    sourceMap: true
                };
                const mapOpions: Object = {
                    sourceMap: true,
                    inlineSourceMap: false,
                    inlineSources: false,
                    sourceRoot: '',
                    mapRoot: '',
                    extendedDiagnostics: false
                };
                const host = ets2ts.tsModule.createCompilerHost(options);
                const fileName: string = node.fileName;
                // @ts-ignore
                const sourceMapGenerator = ets2ts.tsModule.createSourceMapGenerator(
                    host,
                    // @ts-ignore
                    ets2ts.tsModule.getBaseFileName(fileName),
                    '',
                    '',
                    mapOpions
                );
                // @ts-ignore
                const writer: ts.EmitTextWriter = ets2ts.tsModule.createTextWriter(
                    // @ts-ignore
                    ets2ts.tsModule.getNewLineCharacter({
                        newLine: ets2ts.tsModule.NewLineKind.LineFeed,
                        removeComments: false
                    }));
                printer['writeFile'](node, writer, sourceMapGenerator);
                return {
                    content: writer.getText(),
                    sourceMapJson: sourceMapGenerator.toJSON()
                };
            }

            // @ts-ignore
            return (node) => {
                let obj = genContentAndSourceMapInfo(node);

                let etsFileName = ets2ts.getOutputPath(node.fileName);
                if (etsFileName.endsWith('.ets')) {
                    etsFileName = etsFileName.replace(/\.ets$/, '.ts');
                }

                let alias = '';
                dependenciesMap.forEach((value: string) => {
                    if (alias == '') {
                        alias = value;
                    } else {
                        alias += '|' + value;
                    }
                });

                if (alias.length > 0) {
                    const REG_IMPORT_DECL: RegExp = new RegExp('(import)\\s+(?:(.+)|\\{([\\s\\S]+)\\})\\s+from\\s+[\'\"]('+ alias +')(\\S+)[\'\"]', 'g');
                    obj.content = obj.content.replace(REG_IMPORT_DECL, (substring: string, ...args: any[]) => {
                        let relativePath = path.relative(path.dirname(node.fileName), args[3]).replace(new RegExp('\\' + path.sep, 'g'), '/');
                        return substring.replace(args[3], relativePath);
                    });
                }

                fs.writeFileSync(etsFileName, obj.content);
                fs.writeFileSync(etsFileName + '.map', JSON.stringify(obj.sourceMapJson));

                // Memory optimization
                node.statements = [];
                node.text = '';
                node.original = undefined;
                return node;
            }
        }
    }

    private resolveSdkApi() {
        let buildProfile = path.join(this.projectConfig.projectPath, 'build-profile.json5');
        if (fs.existsSync(buildProfile)) {
            let profile = parseJsonText(fs.readFileSync(buildProfile, 'utf-8'));
            let compileSdkVersion = (profile.app as any)?.compileSdkVersion || (profile.app as any)?.products[0]?.compileSdkVersion;
            let compatibleSdkVersion = (profile.app as any)?.compatibleSdkVersion || (profile.app as any)?.products[0]?.compatibleSdkVersion;
            this.projectConfig.minAPIVersion = this.parseApiVersion(compatibleSdkVersion || compileSdkVersion);
        }
    }

    private parseApiVersion(version: string|number): number{
        if (typeof version === 'number') {
            return version;
        }

        const match = /\s*([1-9].[0-9].[0-9])\s*\(\s*(\d+)\s*\)\s*$/g.exec(version);
        if (match) {
            return parseInt(match[2]);
        }

        return 9;
    }

}

export async function runEts2Ts(hosEtsLoaderPath: string, targetProjectOriginDirectory: string, targetProjectDirectory: string, targetProjectName: string) {
    let ets2ts = new Ets2ts();
    await ets2ts.init(hosEtsLoaderPath, targetProjectOriginDirectory, targetProjectDirectory, targetProjectName);
    await ets2ts.compileProject();
}

(async function () {
    Logger.configure(process.argv[6], LOG_LEVEL.INFO);
    logger.info('start ets2ts ', process.argv);
    const startTime = new Date().getTime();
    await runEts2Ts(process.argv[2], process.argv[3], process.argv[4], process.argv[5]);
    const endTime = new Date().getTime();
    logger.info(`ets2ts took: ${(endTime - startTime) / 1000}s`);
})();