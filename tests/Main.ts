import * as ts from "typescript";
import { Scene } from "../src/Scene";
import * as utils from "../src/utils/getAllFiles";
import { Config } from "./Config";

function run(config: Config) {
    const projectName: string = config.projectName;
    const input_dir: string = config.input_dir;

    //(1)get all files under input_dir
    //TODO: add support for using tscconfig to get files
    const projectFiles: string[] = utils.getAllFiles(input_dir, ['.ts']);

    //(2) Fill Scene class
    let scene: Scene = new Scene(projectName, projectFiles);
    const fl = '/Users/yifei/Documents/Code/ArkAnalyzer/sample/sample.ts';
    let mtd = scene.getMethod(fl, 'foo', ['NumberKeyword'], ['NumberKeyword']);
    //logger.info(mtd);
    //logger.info(mtd?.cfg);
    
    //let clsSig = new ClassSignature(fl, "SecurityDoor");
    //logger.info(scene.getFather(clsSig));

    //(3) Conduct Code Transformation
    //if (null != config.sceneTransformer) {
    //    config.sceneTransformer.internalTransform();
    //} else if (null != config.functionTransformer) {
    //    let classes: ArkClass[] = scene.getApplicationClasses();
    //    for (let cls in classes) {
    //        //let methods:ArkMethod[] = cls.getMethods();
    //    }
    //}

    //(4) Re-generate Code
}

//let config: Config = new Config("sample", "./sample");
//run(config);

const filename = "test.ts";
const code = `
const x = {
    foo: true
})
`;

function codeGen() {
    logger.info(code);
    logger.info("#################");
    const sourceFile = ts.createSourceFile(
        filename, code, ts.ScriptTarget.Latest
    );

    const transformerFactory: ts.TransformerFactory<ts.Node> = (
        context: ts.TransformationContext
    ) => {
        return (rootNode) => {
            function visit(node: ts.Node): ts.Node {
                const { factory } = context;
                if (ts.isObjectLiteralExpression(node)) {
                    return factory.updateObjectLiteralExpression(node, [
                        ...node.properties,
                        factory.createPropertyAssignment(
                            factory.createIdentifier("bar"),
                            factory.createTrue()
                        )
                    ]
                    );
                }
                return ts.visitEachChild(node, visit, context);
            }
            return ts.visitNode(rootNode, visit);
        };
    };

    const transformationResult = ts.transform(
        sourceFile, [transformerFactory]
    );

    const transformedSourceFile = transformationResult.transformed[0];
    logger.info(transformedSourceFile);

    const printer = ts.createPrinter();

    //const newContent = printer.printFile(transformedSourceFile as ts.SourceFile);

    const result = printer.printNode(
        ts.EmitHint.Unspecified,
        transformedSourceFile,
        sourceFile
    );

    logger.info(result);
}

codeGen();

debugger;