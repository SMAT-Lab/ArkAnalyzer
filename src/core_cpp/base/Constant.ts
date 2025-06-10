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

import { BigIntType, BooleanType, NullType, NumberType, StringType, Type, UndefinedType } from './Type';
import { Value } from './Value';
import { NULL_KEYWORD, UNDEFINED_KEYWORD } from '../common/TSConst';

/**
 * @category core/base
 */
export class Constant implements Value {
    private readonly value: string;
    private readonly type: Type;

    constructor(value: string, type: Type) {
        this.value = value;
        this.type = type;
    }

    /**
     * Returns the constant's value as a **string**.
     * @returns The constant's value.
     */
    public getValue(): string {
        return this.value;
    }

    public getUses(): Value[] {
        return [];
    }

    /**
     * Returns the type of this constant.
     * @returns The type of this constant.
     */
    public getType(): Type {
        return this.type;
    }

    /**
     * Get a string of constant value in Constant.
     * @returns The string of constant value.
     */
    public toString(): string {
        let str = '';
        if (this.type instanceof StringType) {
            str = "'" + this.value + "'";
        } else {
            str = this.value;
        }
        return str;
    }
}

export class BooleanConstant extends Constant {
    private static readonly FALSE = new BooleanConstant(false);
    private static readonly TRUE = new BooleanConstant(true);

    constructor(value: boolean) {
        super(value.toString(), BooleanType.getInstance());
    }

    public static getInstance(value: boolean): NullConstant {
        return value ? this.TRUE : this.FALSE;
    }
}

export class NumberConstant extends Constant {
    constructor(value: number) {
        super(value.toString(), NumberType.getInstance());
    }
}

export class BigIntConstant extends Constant {
    constructor(value: bigint) {
        super(value.toString(), BigIntType.getInstance());
    }
}

export class StringConstant extends Constant {
    constructor(value: string) {
        super(value.toString(), StringType.getInstance());
    }
}

export class NullConstant extends Constant {
    private static readonly INSTANCE = new NullConstant();

    constructor() {
        super(NULL_KEYWORD, NullType.getInstance());
    }

    public static getInstance(): NullConstant {
        return this.INSTANCE;
    }
}

export class UndefinedConstant extends Constant {
    private static readonly INSTANCE = new UndefinedConstant();

    constructor() {
        super(UNDEFINED_KEYWORD, UndefinedType.getInstance());
    }

    public static getInstance(): UndefinedConstant {
        return this.INSTANCE;
    }
}
