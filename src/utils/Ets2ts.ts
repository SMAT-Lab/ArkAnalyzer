import * as path from 'path';
import * as fs from 'fs';
import Logger from "./logger";

const logger = Logger.getLogger();

async function dynamicImportModule<T>(modulePath: string): Promise<T> {
    const module = await import(modulePath);
    return module.default as T;
}

enum FileType {
    ETS = 0,
    TS = 1
}

/**
 *  let ets2ts = new Ets2ts();
 *  await ets2ts.init(etsLoaderPath, projectPath, output);
 *  await ets2ts.compileProject();
 */
export class Ets2ts {
    processUIModule: any;
    tsModule: any;
    preProcessModule: Function;

    compilerOptions: any;
    projectConfig: any;
    resourcePath: string;

    statistics: Array<Array<number>> = [[0, 0], [0, 0]];

    public async init(etsLoaderPath: string, projectPath: string, output: string, projectName: string) {
        this.tsModule = await import(path.join(etsLoaderPath, 'node_modules/typescript'));
        this.processUIModule = await import(path.join(etsLoaderPath, 'lib/process_ui_syntax'));
        this.preProcessModule = await dynamicImportModule<Function>(path.join(etsLoaderPath, 'lib/pre_process.js'));

        this.compilerOptions = this.tsModule.readConfigFile(
            path.resolve(etsLoaderPath, 'tsconfig.json'), this.tsModule.sys.readFile).config.compilerOptions;
        this.compilerOptions.target = 'ESNext';
        this.compilerOptions.sourceMap = false;

        let module = await import(path.join(etsLoaderPath, 'main'));
        this.projectConfig = module.projectConfig;

        this.projectConfig.projectPath = path.resolve(projectPath);
        this.projectConfig.saveTsPath = path.resolve(output, projectName);
        this.projectConfig.buildMode = "release";
        this.projectConfig.projectRootPath = ".";
    }

    public async compileProject() {
        process.env.rawFileResource = './';
        process.env.compileMode = 'moduleJson';
        process.env.compiler = 'on';
        logger.info('Ets2ts-getAllEts start');
        let sources: Array<string> = [];
        this.getAllEts(this.projectConfig.projectPath, sources);
        logger.info('Ets2ts-getAllEts done');
        for (let src of sources) {
            if (src.endsWith('.ets')) {
                this.compileEts(src);
            } else {
                this.ts2output(src);
            }
        }

        logger.info(`Ets2ts-compileEtsTime: ${this.statistics[0][1] / 1000}s, cnt: ${this.statistics[0][0]}, avg time: ${this.statistics[0][1] / this.statistics[0][0]}ms`);
        logger.info(`Ets2ts-copyTsTime: ${this.statistics[1][1] / 1000}s, cnt: ${this.statistics[1][0]}, avg time: ${this.statistics[1][1] / this.statistics[1][0]}ms`);
    }

    public emitWarning(msg: string) {

    }

    public emitError(msg: string) {

    }

    private compileEts(file: string) {
        let start = new Date().getTime();
        let fileContent: string | undefined = fs.readFileSync(file, 'utf8');
        this.resourcePath = file;
        this.preProcessModule(fileContent);
        this.tsModule.transpileModule(fileContent, {
            compilerOptions: this.compilerOptions,
            fileName: `${file}`,
            transformers: { before: [this.processUIModule.processUISyntax(null, false), this.getDumpSourceTransformer(this)] }
        });
        fileContent = undefined;
        let end = new Date().getTime();
        this.statistics[FileType.ETS][0]++;
        this.statistics[FileType.ETS][1] += end - start;
    }

    private mkOutputPath(filePath: string) {
        let resultPath = this.getOutputPath(filePath);
        fs.mkdirSync(resultPath, { recursive: true });
    }

    private getOutputPath(fileName: string): string {
        let relativePath = path.relative(this.projectConfig.projectPath, fileName);
        return path.join(this.projectConfig.saveTsPath, relativePath);
    }

    private ts2output(fileName: string) {
        let start = new Date().getTime();

        let resultPath = this.getOutputPath(fileName);
        fs.cpSync(fileName, resultPath);

        let end = new Date().getTime();
        this.statistics[FileType.TS][0]++;
        this.statistics[FileType.TS][1] += end - start;
    }

    private getAllEts(srcPath: string, ets: string[] = []): boolean {
        const ignore = ['.git', '.preview', '.hvigor', '.idea'];
        let hasFile = false;
        fs.readdirSync(srcPath, { withFileTypes: true }).forEach(file => {
            const realFile = path.resolve(srcPath, file.name);
            if (file.isDirectory() && (!ignore.includes(file.name))) {
                if (this.getAllEts(realFile, ets)) {
                    hasFile = true;
                    this.mkOutputPath(realFile);
                }
            } else {
                if (path.basename(realFile).endsWith('.ets') || path.basename(realFile).endsWith('.ts')) {
                    ets.push(realFile);
                    hasFile = true;
                }
            }
        });
        return hasFile;
    }

    getDumpSourceTransformer(ets2ts: Ets2ts): Function {
        // @ts-ignore
        return (context) => {
            // @ts-ignore
            function genContentAndSourceMapInfo(node): { content: string, sourceMapJson: string } {
                const printer = ets2ts.tsModule.createPrinter({ newLine: ets2ts.tsModule.NewLineKind.LineFeed });
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

}

export async function runEts2Ts(hosEtsLoaderPath: string, targetProjectOriginDirectory: string, targetProjectDirectory: string, targetProjectName: string) {
    let ets2ts = new Ets2ts();
    await ets2ts.init(hosEtsLoaderPath, targetProjectOriginDirectory, targetProjectDirectory, targetProjectName);
    await ets2ts.compileProject();
}




