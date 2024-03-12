namespace Validation {

    // TODO: initializer not support
    enum FileAccess {
        // constant members
        None,
        Read    = 1 << 1,
        Write   = 1 << 2,
        ReadWrite  = Read | Write,
        // computed member
        G = "123".length,
    }

    export interface StringValidator {
        // TODO: error - name parse to StringValidator
        isAcceptable(s: string): boolean;
    }

    export class LettersOnlyValidator implements StringValidator {
        isAcceptable(s: string) {
            return lettersRegexp.test(s);
        }
    }

    export class ZipCodeValidator implements StringValidator {
        isAcceptable(s: string) {
            return s.length === 5 && numberRegexp.test(s);
        }
    }

    // TODO: Not Support
    function test(): void {
        logger.info('');
    }

    // TODO: Not Support
    const lettersRegexp = /^[A-Za-z]+$/;
    const numberRegexp = /^[0-9]+$/;
}

namespace Shapes {
    export namespace Polygons {
        export class Triangle { }
        export class Square { }
    }
}