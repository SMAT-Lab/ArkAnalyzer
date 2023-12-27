import { Config } from "../Config";
import { Scene } from "../Scene";
import { PerformanceChecker } from "../checker/PerformanceChecker";
import * as utils from "../utils/utils";

import ts from "typescript";
const fs = require('fs');

export class PerformanceCheckerTest {
    private loadPerformanceChecker(): PerformanceChecker {
        let performanceChecker = new PerformanceChecker();
        return performanceChecker;
    }

    public testPerformanceChecker() {
        let performanceChecker = this.loadPerformanceChecker();

        let config = new Config("checkerTest", "tests\\resources\\checker");
        const projectName: string = config.projectName;
        const input_dir: string = config.input_dir;

        const projectFiles: string[] = utils.getAllFiles(input_dir, ['.ts']);

        let scene = new Scene(projectName, projectFiles);
        for (const arkFile of scene.arkFiles) {
            performanceChecker.checkDeteleProperty(arkFile);
        }
    }
}

let performanceCheckerTest = new PerformanceCheckerTest();
performanceCheckerTest.testPerformanceChecker();

debugger