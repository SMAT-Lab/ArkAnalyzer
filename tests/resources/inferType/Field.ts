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

import { Constants, globalFunction } from './constants';

class C1 {

    public n: number = 1;
    public c: C1 = new C1();
    private string = 'test';
    private number = 123.123;

    private s = this.c.toString() ?? 'testing';
    public objs: C1[] = [];
    public objs2: C2[] = [new C2()];
}

class C2 {
    f2(p1: C1) {
        console.log(p1.c, p1.n);
    }

    test_report() {
        let a: number[] = [1, 2, 3];
        a['a'] = 2;
        let b = a['b'];
        b = (a['a'] == a[a[2]]);
        if (a['b'] === 0) {
            b = 1;
        }
    }
}

class FieldType {
    arrUnionHa: (number | string)[] = [1, 'hello'];
    public field1 = Constants.staticFunc();

}

function time2(value: number): number {
    return 2 * value;
}

class importClassTest {

    private test = Constants;
    private f1: (value: number) => number = time2;

    public importAssign() {
        let a = globalFunction;
        let abc = Constants;
    }

}

class User {
    roles = ['user'];
    selectIndex: number = 0;
    role: string = this.roles[this.selectIndex];
}

class TestPTA {
    onClick1: (data: number) => void;
    onClick2: undefined | ((data: number) => void);

    /**
     * 正确，@main/mian.ets: Test.%AM0(number)，ArkPtrInvokeExpr，有param，有arg，数据流构建成功
     */
    foo(): void {
        this.onClick1(1);
    }

    /**
     * 错误，@main/mian.ets: Test.onClick2()，ArkInstanceInvokeExpr，没有param，有arg，数据流构建失败
     */
    goo(): void {
        this.onClick2(2);
    }
}
