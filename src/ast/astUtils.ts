import {spawnSync} from 'child_process';
import * as fs from 'fs';
import * as path from "path";
import * as os from "os";

import Logger, {LOG_MODULE_TYPE} from '../utils/logger'
import {ClangPath} from "./const";

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'astUtils');

export class AstUtils {
    private static currentAccess:string = "public";

    public static parse(sourceFile: string): JSON | null{
        if (!fs.existsSync(sourceFile)){
            logger.warn("parse file is not exists");
            return null;
        }
        let clangPath: string = this.getPlatformClang().toString();
        if (clangPath === ""){
            logger.warn("can not find clang path");
            return null;
        }
        let astPath:string = this.getAstOutputPath(sourceFile);

        let parseArguments: string[] = [sourceFile, '-o', astPath];
        this.ensureOutputDir(path.dirname(astPath));

        let parseResult = spawnSync(clangPath, parseArguments, {stdio:['inherit','pipe'], encoding: 'utf-8'});
        if (parseResult.status){
            logger.info("Error parsing ast", parseResult.stderr);
        } else{
            logger.info("Parsing completed!");
        }

        let translationUnit: JSON = JSON.parse(fs.readFileSync(astPath, "utf-8"));
        translationUnit = this.filter(sourceFile, translationUnit);
        deleteFIle(astPath);
        return translationUnit;
    }

    private static updateInner(sourceFile: string, firstOccurrenceOfMainFile:boolean, entry:any, newInner:any[]): void {
        if (!firstOccurrenceOfMainFile){
            if (Object.prototype.hasOwnProperty.call(entry, "isImplicit") && entry.isImplicit) {
                return;
            }
            let fileName = "";
            let loc = entry.loc;
            if (Object.prototype.hasOwnProperty.call(loc, "file")){
                fileName = loc.file;
            }
            if (Object.prototype.hasOwnProperty.call(loc, "expansionLoc")){
                if (Object.prototype.hasOwnProperty.call(loc.expansionLoc, "file")){
                    fileName = loc.expansionLoc.file;
                }
            }
            if (fileName !== sourceFile){
                return;
            }
            firstOccurrenceOfMainFile = true;
        }
        newInner.push(entry);

    }

    private static filter(sourceFile:string, translationUnit: any) {
        let newInner: any[] = [];
        let firstOccurrenceOfMainFile: boolean = false;
        for (let index in translationUnit.inner){
            if (Object.prototype.hasOwnProperty.call(translationUnit.inner,index)){
                let entry = translationUnit.inner[index];
                this.updateInner(sourceFile, firstOccurrenceOfMainFile, entry, newInner);
            }
        }
        translationUnit.inner = newInner;
        translationUnit.fileName = sourceFile;
        translationUnit.projectName = path.dirname(sourceFile);
        this.fullInfo(translationUnit);
        return translationUnit;
    }

    private static filterChildren(cursor: any): any[]{
        let filteredChildren: any[] = [];
        if (!Object.prototype.hasOwnProperty.call(cursor, "inner")){
            return filteredChildren;
        }
        filteredChildren = cursor.inner.filter((item:any) =>
            (!Object.prototype.hasOwnProperty.call(cursor, "isImplicit") || !item.isImplicit)
            || cursor.kind === "LambdaExpr" || item.isUsed);
        return filteredChildren;
    }

    private static fullInfo(cursor:any){
        cursor.inner = this.filterChildren(cursor);
        for (let index in cursor.inner){
            if (Object.prototype.hasOwnProperty.call(cursor.inner, index)){
                let currentCursor = cursor.inner[index];
                type GetParentCallBack = any & {
                    getParent:() => any;
                };
                currentCursor = Object.assign(currentCursor, {
                    getParent:() => {
                        let parentCursor = {...cursor}
                        delete parentCursor.inner;
                        return parentCursor;
                    }
                }) as GetParentCallBack;
                this.processAccess(currentCursor);
                this.fullInfo(cursor.inner[index]);
            }
        }
    }

    private static processAccess(cursor:any){
        if (cursor.kind === "AccessSpecDecl"){
            this.currentAccess = cursor.access;
        }
        if (cursor.kind === "CXXMethodDecl" || cursor.kind === "FieldDecl" ||
            cursor.kind === "VarDecl" || cursor.kind === "FriendDecl"){
            if (!cursor.isImplicit){
                cursor.access = this.currentAccess;
            }
        }
    }

    private static getAstOutputPath(sourceFile:string): string {
        const fileName = `${path.parse(path.basename(sourceFile)).name}_AST.json`;
        return path.join(ClangPath.protectRoot, "src", "ast","out", fileName);
    }

    private static ensureOutputDir(dir:string): void{
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, {recursive:true});
        }
    }

    private static getPlatformClang(): string{
        let platform = os.platform();
        switch (platform) {
            case "win32":
                return ClangPath.WindowsPath;
            case "linux":
                return ClangPath.LinuxPath;
            default:
                return ClangPath.Unknown;
        }
    }
}

async function deleteFIle(filePath:string){
    try {
        await fs.promises.unlink(filePath);
        logger.info("delete file ok:", filePath);
    } catch (err){
        logger.warn("delete file is not ok:", filePath);
    }
}