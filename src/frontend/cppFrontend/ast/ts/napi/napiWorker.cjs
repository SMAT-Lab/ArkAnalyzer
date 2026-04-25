/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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
'use strict';

const addonPath = process.argv[2];
if (!addonPath) {
    throw new Error('napiWorker requires addon path');
}

const addon = require(addonPath);
if (typeof addon.runArgv !== 'function') {
    throw new Error('astJsonDumper.node: missing runArgv export');
}

function restoreProcessContext(prevCwd, prevPath, hadPath) {
    if (hadPath) {
        process.env.PATH = prevPath;
    } else {
        delete process.env.PATH;
    }
    process.chdir(prevCwd);
}

process.on('message', (message) => {
    if (!message || message.type !== 'run') {
        return;
    }

    const state = new Int32Array(message.state);
    const prevCwd = process.cwd();
    const prevPath = process.env.PATH;
    const hadPath = Object.prototype.hasOwnProperty.call(process.env, 'PATH');
    try {
        process.chdir(message.cwd);
        if (message.envPath !== undefined) {
            process.env.PATH = message.envPath;
        }
        const rc = addon.runArgv(message.argv);
        Atomics.store(state, 1, typeof rc === 'number' ? rc : 1);
    } catch (error) {
        console.error('[napiWorker] request failed:', error);
        Atomics.store(state, 1, -1);
    } finally {
        restoreProcessContext(prevCwd, prevPath, hadPath);
        Atomics.store(state, 0, 1);
        Atomics.notify(state, 0);
    }
});
