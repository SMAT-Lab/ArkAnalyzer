'use strict';

const { existsSync, realpathSync, rmSync } = require('fs');
const { resolve, sep } = require('path');

let _safeReal = null;

function safeRealRoot() {
    if (_safeReal === null) {
        try {
            _safeReal = realpathSync(resolve(__dirname, '..', '..'));
        } catch {
            _safeReal = realpathSync(process.cwd());
        }
    }
    return _safeReal;
}

/** Safe rmSync with junction/symlink traversal protection. */
function rmDirSafe(target) {
    let realTarget;
    try {
        if (!existsSync(target)) {
            return;
        }
        realTarget = realpathSync(target);
    } catch {
        return;
    }
    const safeReal = safeRealRoot();
    if (realTarget !== safeReal && !realTarget.startsWith(safeReal + sep)) {
        console.warn('[H-02] refused unsafe rm: ' + target + ' (realpath=' + realTarget + ' is outside ' + safeReal + ')');
        return;
    }
    rmSync(target, { recursive: true, force: true });
}

exports.rmDirSafe = rmDirSafe;
