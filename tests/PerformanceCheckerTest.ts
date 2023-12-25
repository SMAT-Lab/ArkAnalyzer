import { PerformanceChecker } from "../checker/PerformanceChecker";

import ts from "typescript";
const fs = require('fs');

export class PerformanceCheckerTest {
    private loadPerformanceChecker(): PerformanceChecker {        
        let performanceChecker = new PerformanceChecker();        
        return performanceChecker;
    }

    public testPerformanceChecker() {
        let performanceChecker = this.loadPerformanceChecker();
                
        let filename = './tests/resources/checker/main.ts';
        let codeAsString = fs.readFileSync(filename).toString();
        let sourceFile = ts.createSourceFile(filename, codeAsString, ts.ScriptTarget.Latest);
        performanceChecker.checkDeteleProperty(sourceFile);
    }
}

let performanceCheckerTest = new PerformanceCheckerTest();
performanceCheckerTest.testPerformanceChecker();

debugger