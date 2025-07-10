// CoreFactory.ts
export function isCppFile(filePath: string): boolean {
    return /\.(cpp|c|h)$/i.test(filePath);
}

export class CoreFactory {
    static getArkClass(filePath: string) {
        return isCppFile(filePath)
            ? require('./jingwei_cpp_frontend/model/ArkClass').ArkClass
            : require('./core/model/ArkClass').ArkClass;
    }
    static getArkFile(filePath: string) {
        return isCppFile(filePath)
            ? require('./jingwei_cpp_frontend/model/ArkFile').ArkFile
            : require('./core/model/ArkFile').ArkFile;
    }
    static getArkMethod(filePath: string) {
        return isCppFile(filePath)
            ? require('./jingwei_cpp_frontend/model/ArkMethod').ArkMethod
            : require('./core/model/ArkMethod').ArkMethod;
    }
    static getArkNamespace(filePath: string) {
        return isCppFile(filePath)
            ? require('./jingwei_cpp_frontend/model/ArkNamespace').ArkNamespace
            : require('./core/model/ArkNamespace').ArkNamespace;
    }
    static getClassSignature(filePath: string) {
        return isCppFile(filePath)
            ? require('./jingwei_cpp_frontend/model/ArkSignature').ClassSignature
            : require('./core/model/ArkSignature').ClassSignature;
    }
    static getFileSignature(filePath: string) {
        return isCppFile(filePath)
            ? require('./jingwei_cpp_frontend/model/ArkSignature').FileSignature
            : require('./core/model/ArkSignature').FileSignature;
    }
    static getMethodSignature(filePath: string) {
        return isCppFile(filePath)
            ? require('./jingwei_cpp_frontend/model/ArkSignature').MethodSignature
            : require('./core/model/ArkSignature').MethodSignature;
    }
    static getNamespaceSignature(filePath: string) {
        return isCppFile(filePath)
            ? require('./jingwei_cpp_frontend/model/ArkSignature').NamespaceSignature
            : require('./core/model/ArkSignature').NamespaceSignature;
    }
    static getBuildArkFileFromFile(filePath: string) {
        return isCppFile(filePath)
            ? require('./jingwei_cpp_frontend/model/builder/ArkFileBuilder').buildArkFileFromFile
            : require('./core/model/builder/ArkFileBuilder').buildArkFileFromFile;
    }
    static getBuildDefaultConstructor(filePath: string) {
        return isCppFile(filePath)
            ? require('./jingwei_cpp_frontend/model/builder/ArkMethodBuilder').buildDefaultConstructor
            : require('./core/model/builder/ArkMethodBuilder').buildDefaultConstructor;
    }
    static getAddInitInConstructor(filePath: string) {
        return isCppFile(filePath)
            ? require('./jingwei_cpp_frontend/model/builder/ArkMethodBuilder').addInitInConstructor
            : require('./core/model/builder/ArkMethodBuilder').addInitInConstructor;
    }
    static getExportInfo(filePath: string) {
        return isCppFile(filePath)
            ? require('./jingwei_cpp_frontend/model/ArkExport').ExportInfo
            : require('./core/model/ArkExport').ExportInfo;
    }
    static getCallGraph(filePath: string) {
        return isCppFile(filePath)
            ? require('./callgraph_cpp/model/CallGraph').CallGraph
            : require('./callgraph/model/CallGraph').CallGraph;
    }
    static getCallGraphBuilder(filePath: string) {
        return isCppFile(filePath)
            ? require('./callgraph_cpp/model/builder/CallGraphBuilder').CallGraphBuilder
            : require('./callgraph/model/builder/CallGraphBuilder').CallGraphBuilder;
    }
}
