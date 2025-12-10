/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

 namespace ClosureTest {
    class NumberValue {
        constructor(private value: number) { }
        getValue(): number {
            return this.value;
        }
    }

     class StringValue {
        constructor(private value: string) { }
        getValue(): string {
            return this.value;
        }
    }

     class BooleanValue {
        constructor(private value: boolean) { }
        getValue(): boolean {
            return this.value;
        }
    }

     let globalValue: NumberValue = new NumberValue(0);

     class BasicTest {
        public listeners: NumberValue[] = [];

         basicOuterMethod1(): NumberValue {
            const output = new NumberValue(3);
            function basicNestedMethod1(input: NumberValue): NumberValue {
                return new NumberValue(output.getValue() + input.getValue());
            }
            return basicNestedMethod1(new NumberValue(2));
        }

         basicOuterMethod2(index: NumberValue): void {
            this.listeners.forEach(listener => {
                console.log(index.getValue() + listener.getValue());
            });
        }

         basicOuterMethod3(output: StringValue): void {
            let basicNestedMethod3 = function (): void {
                console.log(output.getValue());
            };
            basicNestedMethod3();
        }
    }

     function basicOuterMethod4(): (input: NumberValue) => void {
        const base = new NumberValue(3);
        return function basicNestedMethod4(input: NumberValue): void {
            input = new NumberValue(input.getValue() + base.getValue());
        };
    }

     function callMethod4(): void {
        let callMethod = basicOuterMethod4();
        callMethod(new NumberValue(3));
    }

     function outerFunction1(outerInput: NumberValue): void {
        let count = new NumberValue(0);
        let flag = new NumberValue(1);
        function innerFunction1(innerInput: StringValue): StringValue {
            count = new NumberValue(count.getValue() + 1);
            let result: StringValue;
            switch (flag.getValue()) {
                case 1:
                    result = new StringValue(innerInput.getValue() + 'ok1');
                    break;
                case 2:
                    result = new StringValue(innerInput.getValue() + 'ok2');
                    break;
                default:
                    result = new StringValue(innerInput.getValue() + 'no ok');
            }
            return result;
        }
        console.log(innerFunction1(new StringValue('abc')).getValue());

         let innerFunction2 = function (): void {
            console.log(outerInput.getValue());
        };
        innerFunction2();
    }

     class ClosureClass {
        public outerFunction2(outerInput: NumberValue): void {
            console.log(innerFunction2(new StringValue('abc')).getValue());
            function innerFunction2(outerInput: StringValue): StringValue {
                count = new StringValue(count.getValue() + outerInput.getValue());
                for (let item of nums) {
                    count = new StringValue(count.getValue() + item.getValue());
                }
                return new StringValue(`${outerInput.getValue()}: ${count.getValue()}`);
            }
            let count = new StringValue('abc');
            let nums = [new NumberValue(1), new NumberValue(2), new NumberValue(3), new NumberValue(4)];
        }
    }

     namespace closureNamespace {
        export function outerFunction3(outerInput: NumberValue): StringValue {
            let count = new NumberValue(0);
            let size = new NumberValue(10);
            function innerFunction3(): StringValue;
            function innerFunction3(innerInput: StringValue): StringValue;
            function innerFunction3(innerInput?: StringValue): StringValue {
                let res = new NumberValue(count.getValue() + size.getValue() + globalValue.getValue());
                return new StringValue(`${outerInput.getValue()}: ${res.getValue()}`);
            }
            return innerFunction3();
        }

         export class ClosureClass {
            public outerFunction4(outerInput: NumberValue): void {
                let flag = new BooleanValue(true);
                let res = new StringValue('no ok');
                innerFunction4();
                function innerFunction4(): void {
                    if (!flag.getValue()) {
                        return;
                    }
                    try {
                        while (outerInput.getValue() > 0) {
                            outerInput = new NumberValue(outerInput.getValue() - 1);
                        }
                    } catch (error) {
                        console.log(error);
                    }
                }
            }
        }
    }

     class MultipleNestedTest {
        public listeners: NumberValue[][] = [[new NumberValue(321)]];

         outerMethod1(x: StringValue): NumberValue {
            const a = new NumberValue(3);
            const b = new StringValue('xyz');
            function nested1Method1(b: NumberValue): NumberValue {
                const c = new StringValue('xyz');
                function nested2Method1(c: NumberValue): NumberValue {
                    function nested3Method1(): NumberValue {
                        return new NumberValue(a.getValue() + b.getValue() + c.getValue());
                    }
                    return nested3Method1();
                }
                return nested2Method1(new NumberValue(1));
            }

             function nested11Method1(b: NumberValue): NumberValue {
                const c = new StringValue('xyz');
                function nested22Method1(c: NumberValue): NumberValue {
                    return new NumberValue(b.getValue() + c.getValue());
                }
                function nested33Method1(): StringValue {
                    return x;
                }
                return nested22Method1(new NumberValue(1));
            }

             function nested111Method1(b: NumberValue): NumberValue {
                const c = new StringValue('xyz');
                function nested222Method1(c: NumberValue): NumberValue {
                    return new NumberValue(b.getValue() + c.getValue());
                }
                return nested222Method1(new NumberValue(1));
            }
            return nested1Method1(new NumberValue(2));
        }

         outerMethod2(a: NumberValue): void {
            // const x = new NumberValue(123);
            this.listeners.forEach(listener => {
                listener.forEach(item => {
                    console.log(a.getValue() + item.getValue());
                    console.log(listener.length);
                });
            });
        }

         outerMethod3(a: StringValue): void {
            let nestedMethod3 = function (): void {
                const b = new StringValue('abc');
                const x = new NumberValue(123);
                let nestedInNestedMethod3 = function (): void {
                    console.log(a.getValue() + b.getValue());
                };
                nestedInNestedMethod3();
            };
            nestedMethod3();
        }

         outerMethod4(): (a: NumberValue) => () => void {
            const b = new NumberValue(3);
            return function nestedMethod4(a: NumberValue): () => void {
                const x = new NumberValue(123);
                return function nestedInNestedMethod4(): void {
                    a = new NumberValue(a.getValue() + b.getValue());
                };
            };
        }

         callMethod4(): void {
            let callMethod = this.outerMethod4();
            let callMethod2 = callMethod(new NumberValue(3));
            callMethod2();
        }
    }

     function main(): void {
        let basicTest = new BasicTest();
        let result1 = basicTest.basicOuterMethod1();
        basicTest.basicOuterMethod2(new NumberValue(1));
        basicTest.basicOuterMethod3(new StringValue('abc'));

         callMethod4();
        outerFunction1(new NumberValue(1));

         let closureClass = new ClosureClass();
        closureClass.outerFunction2(new NumberValue(1));

         let result2 = closureNamespace.outerFunction3(new NumberValue(1));
        let closureClassNamespace = new closureNamespace.ClosureClass();
        closureClassNamespace.outerFunction4(new NumberValue(1));
        
        let multipleNestedTest = new MultipleNestedTest();
        let result3 = multipleNestedTest.outerMethod1(new StringValue('abc'));
        multipleNestedTest.outerMethod2(new NumberValue(1));
        multipleNestedTest.outerMethod3(new StringValue('abc'));
        multipleNestedTest.callMethod4();
    }
}