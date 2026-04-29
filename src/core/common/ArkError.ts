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

export enum ArkErrorCode {
    OK = 0,
    CLASS_INSTANCE_FIELD_UNDEFINED = -1,
    BB_MORE_THAN_ONE_BRANCH_RET_STMT = -2,
    BB_BRANCH_RET_STMT_NOT_AT_END = -3,
    CFG_NOT_FOUND_START_BLOCK = -4,
    CFG_HAS_UNREACHABLE_BLOCK = -5,
    METHOD_SIGNATURE_UNDEFINED = -6,
    METHOD_SIGNATURE_LINE_UNMATCHED = -7,
    /** CLI: invalid flag value or unsupported option */
    CLI_INVALID_OPTION = -8,
    /** CLI: method reference matches more than one method */
    CLI_AMBIGUOUS_METHOD_REF = -9,
    /** CLI: entry method could not be resolved */
    CLI_ENTRY_METHOD_NOT_FOUND = -10,
}

export interface ArkError {
    errCode: ArkErrorCode;
    errMsg?: string;
}

/**
 * Error thrown by ArkAnalyzer when reporting a structured {@link ArkError}.
 * Static helpers produce unified console text for operators.
 */
export class ArkAnalyzerError extends Error {
    public readonly arkError: ArkError;

    constructor(arkError: ArkError) {
        super(arkError.errMsg ?? `ArkErrorCode(${arkError.errCode})`);
        this.name = 'ArkAnalyzerError';
        this.arkError = arkError;
        Object.setPrototypeOf(this, new.target.prototype);
    }

    getErrCode(): number {
        return this.arkError.errCode;
    }

    override toString(): string {
        return ArkAnalyzerError.formatArkErrorConsole(this.arkError);
    }

    /** Resolve numeric {@link ArkErrorCode} to its enum member name for display. */
    private static getArkErrorCodeName(errCode: ArkErrorCode): string {
        const name = ArkErrorCode[errCode];
        return typeof name === 'string' ? name : `UNKNOWN_${errCode}`;
    }

    /**
     * Human-readable stderr format for operators:
     * `arkanalyzer: error: [<code>] (<errCode>) <message>`
     * Multi-line `errMsg` is printed on following lines, each prefixed with `arkanalyzer: error: | `.
     */
    private static formatArkErrorConsole(arkError: ArkError): string {
        const code = ArkAnalyzerError.getArkErrorCodeName(arkError.errCode);
        const errCode = arkError.errCode;
        const message = arkError.errMsg ?? '';
        const head = `arkanalyzer: error: [${code}] (${errCode})`;
        if (!message) {
            return head;
        }
        if (!message.includes('\n')) {
            return `${head} ${message}`;
        }
        const body = message
            .split('\n')
            .map((line) => `arkanalyzer: error: | ${line}`)
            .join('\n');
        return `${head}\n${body}`;
    }

    
}
