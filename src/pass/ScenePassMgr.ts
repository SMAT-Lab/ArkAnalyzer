/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { AnyKey, Context, CtxArg, UpperRoot } from './Context';
import Logger, { LOG_MODULE_TYPE } from '../utils/logger';
import { Dispatcher } from './Dispatcher';
import { ClassCtx, ClassPass, FallAction, FileCtx, FilePass, MethodCtx, MethodPass } from './Pass';
import type { Scene } from '../Scene';
import type { ArkFile } from '../core/model/ArkFile';
import type { ArkClass } from '../core/model/ArkClass';
import type { ArkMethod } from '../core/model/ArkMethod';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'SceneMgr');

/**
 * Represents a specialized context class that extends the base Context class with specific types.
 * Provides functionality to access the root context within a hierarchical structure.
 * The SceneCtx is bound to a UpperRoot and CtxArg, defining its operational scope.
 * The root method retrieves the top-level SceneCtx itself.
 */
export class SceneCtx extends Context<UpperRoot, CtxArg> {
    constructor() {
        super(UpperRoot.getInstance());
    }

    root(): SceneCtx {
        return this;
    }
}

/**
 * Represents the properties required for configuring various passes in a system.
 * The PassProps interface is designed to hold arrays of different types of passes,
 * specifically file-level, class-level, and method-level passes. Each pass type
 * is identified by a unique key and associated with specific configurations or rules.
 * These passes are used to define how certain operations or validations should be
 * applied at different levels of granularity within the system.
 */
export interface PassProps {
    // file pass
    file: AnyKey<FilePass>[];
    // class pass
    klass: AnyKey<ClassPass>[],
    // method pass
    method: AnyKey<MethodPass>[]
}

/**
 * Represents the properties for a selector configuration.
 * Provides options to define callback functions for selecting files, classes, and methods.
 * The file property allows specifying a function to select files from a given scene.
 * The klass property allows specifying a function to select classes from a given file.
 * The method property allows specifying a function to select methods from a given class.
 */
export interface SelectorProps {
    // select files
    file?: (s: Scene) => ArkFile[],
    // select classes
    klass?: (s: ArkFile) => ArkClass[],
    // select methods
    method?: (s: ArkClass) => ArkMethod[]
}

/**
 * Represents the properties for configuring a scene pass manager.
 *
 * The SceneProps interface allows defining optional configurations for a scene,
 * including rendering passes, selector properties, and a dispatcher implementation.
 *
 * The passes property defines the configuration for rendering stages or phases within the scene.
 *
 * The selectors property provides options for selecting elements or components within the scene.
 *
 * The dispatcher property specifies the dispatcher class responsible for handling events or actions
 * within the scene, defaulting to the base Dispatcher type if not provided.
 */
export interface SceneProps {
    passes?: PassProps;
    selectors?: SelectorProps;
    dispatcher?: typeof Dispatcher;
}

export class ScenePassMgr {
    private passes: PassProps = {
        file: [],
        klass: [],
        method: [],
    };
    private selectors?: SelectorProps = undefined;
    private dispatcher?: typeof Dispatcher = Dispatcher;
    private sctx: SceneCtx = new SceneCtx();

    constructor(props: SceneProps) {
        if (props.passes) {
            this.passes = props.passes;
        }
        if (props.selectors) {
            this.selectors = props.selectors;
        }
        if (props.dispatcher) {
            this.dispatcher = props.dispatcher;
        }
    }

    sceneContext(): SceneCtx {
        return this.sctx;
    }

    run(scene: Scene): void {
        logger.info('run scene');
        let files;
        if (this.selectors?.file) {
            files = this.selectors.file(scene);
        } else {
            files = scene.getFiles();
        }
        for (let file of files) {
            this.iterFile(file);
        }
    }

    private iterFile(file: ArkFile): void {
        let fctx: FileCtx = new FileCtx(this.sctx);
        for (let P of this.passes.file) {
            let p = new P();
            if (p.run(file, fctx) === FallAction.Break) {
                break;
            }
        }
        let classes;
        if (this.selectors?.klass) {
            classes = this.selectors.klass(file);
        } else {
            classes = file.getClasses();
        }
        for (let cls of classes) {
            this.iterClass(cls, fctx);
        }
    }

    private iterClass(cls: ArkClass, fctx: FileCtx): void {
        let cctx: ClassCtx = new ClassCtx(fctx);
        for (let P of this.passes.klass) {
            let p = new P();
            if (p.run(cls, cctx) === FallAction.Break) {
                break;
            }
        }
        let methods;
        if (this.selectors?.method) {
            methods = this.selectors.method(cls);
        } else {
            methods = cls.getMethods();
        }
        for (let mtd of methods) {
            this.iterMethod(mtd, cctx);
        }
    }

    private iterMethod(mtd: ArkMethod, cctx: ClassCtx): void {
        let mctx: MethodCtx = new MethodCtx(cctx);
        for (let P of this.passes.method) {
            let p = new P();
            if (p.run(mtd, mctx) === FallAction.Break) {
                break;
            }
        }
        if (this.dispatcher) {
            let stmts = mtd.getCfg()?.getStmts() || [];
            let dispatcher = new this.dispatcher(mctx);
            for (let s of stmts) {
                dispatcher.dispatchStmt(mtd, s);
            }
        }
    }
}