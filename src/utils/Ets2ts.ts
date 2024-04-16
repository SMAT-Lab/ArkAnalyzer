import * as path from 'path';
import * as fs from 'fs';

async function dynamicImportModule<T>(modulePath: string): Promise<T> {
    const module = await import(modulePath);
    return module.default as T;
}

/**
 *  let ets2ts = new Ets2ts();
 *  await ets2ts.init(etsLoaderPath, projectPath, output);
 *  await ets2ts.compileProject();
 */
export class Ets2ts {
    processUIModule: any;
    tsModule: any;
    utilsModule: any;
    validateUIModule: any;
    preProcessModule: Function;

    compilerOptions: any;
    projectConfig: any;
    resourcePath: string;

    public async init(etsLoaderPath: string, projectPath: string, output: string, projectName: string) {
        this.tsModule = await import(path.join(etsLoaderPath, 'node_modules/typescript'));
        this.processUIModule = await import(path.join(etsLoaderPath, 'lib/process_ui_syntax'));
        this.utilsModule = await import(path.join(etsLoaderPath, 'lib/utils'));
        this.validateUIModule = await import(path.join(etsLoaderPath, 'lib/validate_ui_syntax'));
        this.preProcessModule = await dynamicImportModule<Function>(path.join(etsLoaderPath, 'lib/pre_process.js'));

        this.compilerOptions = this.tsModule.readConfigFile(
            path.resolve(etsLoaderPath, 'tsconfig.json'), this.tsModule.sys.readFile).config.compilerOptions;

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

        let sources = this.getAllEts(this.projectConfig.projectPath);
        for (let src of sources) {
            if (src.endsWith('.ets')) {
                this.compileEts(src);
            } else {
                this.ts2output(src);
            }
        }
    }

    public emitWarning(msg: string) {

    }

    public emitError(msg: string) {

    }

    private compileEts(file: string) {
        let fileContent = fs.readFileSync(file, 'utf8');
        this.resourcePath = file;
        this.preProcessModule(fileContent);
        this.tsModule.transpileModule(fileContent, {
            compilerOptions: this.compilerOptions,
            fileName: `${file}`,
            transformers: { before: [this.processUIModule.processUISyntax(null, false), this.getDumpSourceTransformer(this)] }
        });
    }

    private getOutputPath(fileName: string): string {
        let relativePath = path.relative(this.projectConfig.projectPath, fileName);
        let resultPath = path.join(this.projectConfig.saveTsPath, relativePath);
        let resultDirPath = path.dirname(resultPath);
        fs.mkdirSync(resultDirPath, { recursive: true });

        return resultPath;
    }

    private ts2output(fileName: string) {
        let relativePath = path.relative(this.projectConfig.projectPath, fileName);
        let resultPath = path.join(this.projectConfig.saveTsPath, relativePath);
        let resultDirPath = path.dirname(resultPath);
        fs.mkdir(resultDirPath, { recursive: true }, (err) => {
            if (err) {
                return console.error('ERROR: Failed to create result TS directory: ', resultDirPath);
            }
            fs.cpSync(fileName, resultPath);
        });
    }

    private getAllEts(srcPath: string, ets: string[] = []) {
        if (!fs.existsSync(srcPath)) {
            console.log(`Input directory is not exist, please check!`);
            return ets;
        }

        const realSrc = fs.realpathSync(srcPath);

        fs.readdirSync(realSrc).forEach(filename => {
            const realFile = path.resolve(realSrc, filename);
            if (fs.statSync(realFile).isDirectory()) {
                this.getAllEts(realFile, ets);
            } else {
                if (path.basename(realFile).endsWith('.ets') || path.basename(realFile).endsWith('.ts')) {
                    ets.push(realFile);
                }
            }
        });
        return ets;
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
                    ets2ts.tsModule.getNewLineCharacter({ newLine: ets2ts.tsModule.NewLineKind.LineFeed, removeComments: false }));
                printer['writeFile'](node, writer, sourceMapGenerator);
                let content: string = writer.getText();

                return {
                    content: content,
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
                return node;
            }
        }
    }

}






