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

export const Class_With_Static_Init_Block_Expect = {
    'Case1': {
        '%statInit': {
            methodSignature: '@class/ClassWithStaticInitBlock.ts: Case1.%statInit()',
            stmts: [
                {
                    text: 'this = this: @class/ClassWithStaticInitBlock.ts: Case1',
                },
                {
                    text: 'staticinvoke <@class/ClassWithStaticInitBlock.ts: Case1.[static]%statBlock0()>()',
                },
                {
                    text: 'return',
                },
            ],
        },
        '%statBlock0': {
            methodSignature: '@class/ClassWithStaticInitBlock.ts: Case1.[static]%statBlock0()',
            stmts: [
                {
                    text: 'this = this: @class/ClassWithStaticInitBlock.ts: Case1',
                },
                {
                    text: 'instanceinvoke console.<@%unk/%unk: .log()>(\'static block\')',
                },
                {
                    text: 'return',
                },
            ],
        },
    },
    'Case2': {
        '%statInit': {
            methodSignature: '@class/ClassWithStaticInitBlock.ts: Case2.%statInit()',
            stmts: [
                {
                    text: 'this = this: @class/ClassWithStaticInitBlock.ts: Case2',
                },
                {
                    text: 'staticinvoke <@class/ClassWithStaticInitBlock.ts: Case2.[static]%statBlock0()>()',
                },
                {
                    text: 'staticinvoke <@class/ClassWithStaticInitBlock.ts: Case2.[static]%statBlock1()>()',
                },
                {
                    text: 'return',
                },
            ],
        },
        '%statBlock0': {
            methodSignature: '@class/ClassWithStaticInitBlock.ts: Case2.[static]%statBlock0()',
            stmts: [
                {
                    text: 'this = this: @class/ClassWithStaticInitBlock.ts: Case2',
                },
                {
                    text: 'instanceinvoke console.<@%unk/%unk: .log()>(\'static block1\')',
                },
                {
                    text: 'return',
                },
            ],
        },
        '%statBlock1': {
            methodSignature: '@class/ClassWithStaticInitBlock.ts: Case2.[static]%statBlock1()',
            stmts: [
                {
                    text: 'this = this: @class/ClassWithStaticInitBlock.ts: Case2',
                },
                {
                    text: 'instanceinvoke console.<@%unk/%unk: .log()>(\'static block2\')',
                },
                {
                    text: 'return',
                },
            ],
        },
    },
    'Case3': {
        '%statInit': {
            methodSignature: '@class/ClassWithStaticInitBlock.ts: Case3.%statInit()',
            stmts: [
                {
                    text: 'this = this: @class/ClassWithStaticInitBlock.ts: Case3',
                },
                {
                    text: 'staticinvoke <@class/ClassWithStaticInitBlock.ts: Case3.[static]%statBlock0()>()',
                },
                {
                    text: '@class/ClassWithStaticInitBlock.ts: Case3.[static]field = 1',
                },
                {
                    text: 'staticinvoke <@class/ClassWithStaticInitBlock.ts: Case3.[static]%statBlock1()>()',
                },
                {
                    text: 'return',
                },
            ],
        },
        '%statBlock0': {
            methodSignature: '@class/ClassWithStaticInitBlock.ts: Case3.[static]%statBlock0()',
            stmts: [
                {
                    text: 'this = this: @class/ClassWithStaticInitBlock.ts: Case3',
                },
                {
                    text: 'instanceinvoke console.<@%unk/%unk: .log()>(\'static block1\')',
                },
                {
                    text: 'return',
                },
            ],
        },
        '%statBlock1': {
            methodSignature: '@class/ClassWithStaticInitBlock.ts: Case3.[static]%statBlock1()',
            stmts: [
                {
                    text: 'this = this: @class/ClassWithStaticInitBlock.ts: Case3',
                },
                {
                    text: 'instanceinvoke console.<@%unk/%unk: .log()>(\'static block2\')',
                },
                {
                    text: 'return',
                },
            ],
        },
    },
};

export const ClassWithGeneratedConstructor = `class ClassWithNoConstructor {
  %instInit(): void {
    label0:
      this = this: @class/ClassWithConstructor.ts: ClassWithNoConstructor
      return
  }

  %statInit(): void {
    label0:
      this = this: @class/ClassWithConstructor.ts: ClassWithNoConstructor
      return
  }

  constructor(): @class/ClassWithConstructor.ts: ClassWithNoConstructor {
    label0:
      this = this: @class/ClassWithConstructor.ts: ClassWithNoConstructor
      instanceinvoke this.<@class/ClassWithConstructor.ts: ClassWithNoConstructor.%instInit()>()
      return this
  }

  test(a: string): void {
    label0:
      a = parameter0: string
      this = this: @class/ClassWithConstructor.ts: ClassWithNoConstructor
      instanceinvoke console.<@%unk/%unk: .log()>('no constructor')
      return
  }
}
`;

export const ClassWithFieldAndConstructor = `class ClassWithNoParamConstructor {
  a: number

  %instInit(): void {
    label0:
      this = this: @class/ClassWithConstructor.ts: ClassWithNoParamConstructor
      return
  }

  %statInit(): void {
    label0:
      this = this: @class/ClassWithConstructor.ts: ClassWithNoParamConstructor
      return
  }

  constructor(): @class/ClassWithConstructor.ts: ClassWithNoParamConstructor {
    label0:
      this = this: @class/ClassWithConstructor.ts: ClassWithNoParamConstructor
      instanceinvoke this.<@class/ClassWithConstructor.ts: ClassWithNoParamConstructor.%instInit()>()
      this.<@class/ClassWithConstructor.ts: ClassWithNoParamConstructor.a> = 123
      return this
  }
}
`;

export const ClassWithFieldAndParamConstructor = `class ClassWithParamsConstructor {
  static a: number
  private b: string

  %instInit(): void {
    label0:
      this = this: @class/ClassWithConstructor.ts: ClassWithParamsConstructor
      return
  }

  %statInit(): void {
    label0:
      this = this: @class/ClassWithConstructor.ts: ClassWithParamsConstructor
      @class/ClassWithConstructor.ts: ClassWithParamsConstructor.[static]a = 123
      return
  }

  constructor(b: string): @class/ClassWithConstructor.ts: ClassWithParamsConstructor {
    label0:
      b = parameter0: string
      this = this: @class/ClassWithConstructor.ts: ClassWithParamsConstructor
      instanceinvoke this.<@class/ClassWithConstructor.ts: ClassWithParamsConstructor.%instInit()>()
      this.<@class/ClassWithConstructor.ts: ClassWithParamsConstructor.b> = b
      return this
  }
}
`;

export const ClassWithSuperConstructor = `class ClassWithSuperConstructor extends ClassWithParamsConstructor {
  c: boolean

  %instInit(): void {
    label0:
      this = this: @class/ClassWithConstructor.ts: ClassWithSuperConstructor
      return
  }

  %statInit(): void {
    label0:
      this = this: @class/ClassWithConstructor.ts: ClassWithSuperConstructor
      return
  }

  constructor(b: string, c: boolean): @class/ClassWithConstructor.ts: ClassWithSuperConstructor {
    label0:
      b = parameter0: string
      c = parameter1: boolean
      this = this: @class/ClassWithConstructor.ts: ClassWithSuperConstructor
      instanceinvoke this.<@class/ClassWithConstructor.ts: ClassWithParamsConstructor.constructor(string)>(b)
      instanceinvoke this.<@class/ClassWithConstructor.ts: ClassWithSuperConstructor.%instInit()>()
      this.<@class/ClassWithConstructor.ts: ClassWithSuperConstructor.c> = c
      return this
  }
}
`;

export const ClassWithParamProperty = `class ClassWithParamProperty {
  static x: number
  y: string
  public a: number
  private readonly b: string
  protected c: boolean
  public d?: string

  %statInit(): void {
    label0:
      this = this: @class/ClassWithConstructor.ts: ClassWithParamProperty
      @class/ClassWithConstructor.ts: ClassWithParamProperty.[static]x = 456
      return
  }

  %instInit(): void {
    label0:
      this = this: @class/ClassWithConstructor.ts: ClassWithParamProperty
      this.<@class/ClassWithConstructor.ts: ClassWithParamProperty.y> = 'abc'
      this.<@class/ClassWithConstructor.ts: ClassWithParamProperty.a> = 123
      return
  }

  constructor(a?: number, b: string, c: boolean, e?: string, d?: string): @class/ClassWithConstructor.ts: ClassWithParamProperty {
    label0:
      a = parameter0: number
      b = parameter1: string
      c = parameter2: boolean
      e = parameter3: string
      d = parameter4: string
      this = this: @class/ClassWithConstructor.ts: ClassWithParamProperty
      instanceinvoke this.<@class/ClassWithConstructor.ts: ClassWithParamProperty.%instInit()>()
      this.<@class/ClassWithConstructor.ts: ClassWithParamProperty.a> = a
      this.<@class/ClassWithConstructor.ts: ClassWithParamProperty.b> = b
      this.<@class/ClassWithConstructor.ts: ClassWithParamProperty.c> = c
      if e == undefined goto label1 label2

    label1:
      e = 'abc'
      goto label2

    label2:
      this.<@class/ClassWithConstructor.ts: ClassWithParamProperty.d> = d
      instanceinvoke console.<@%unk/%unk: .log()>('this is constructor method')
      return this
  }
}
`;

export const InterfaceClass = `interface TestInterface {
  a: string
  b: number
}
`;

export const EnumClass = `enum TestEnum {
  A,
  B,

  %statInit(): void {
    label0:
      this = this: @class/ClassWithOtherCategory.ts: TestEnum
      this.<@class/ClassWithOtherCategory.ts: TestEnum.[static]A> = 123
      this.<@class/ClassWithOtherCategory.ts: TestEnum.[static]B> = 'abc'
      return
  }
}
`;

export const TypeLiteralClass = `typeliteral %AC0 {
  a: string
  b: @class/ClassWithOtherCategory.ts: %AC1
}
`;

export const SubTypeLiteralClass = `typeliteral %AC1 {
  c: @class/ClassWithOtherCategory.ts: %dflt.[static]%dflt()#c
}
`;

export const ObjClass = `object %AC2$%dflt.%dflt {
  a: number
  b: @class/ClassWithOtherCategory.ts: %AC3$%AC2$%dflt.%dflt.%instInit

  constructor(): @class/ClassWithOtherCategory.ts: %AC2$%dflt.%dflt {
    label0:
      this = this: @class/ClassWithOtherCategory.ts: %AC2$%dflt.%dflt
      instanceinvoke this.<@class/ClassWithOtherCategory.ts: %AC2$%dflt.%dflt.%instInit()>()
      return this
  }

  %instInit(): void {
    label0:
      this = this: @class/ClassWithOtherCategory.ts: %AC2$%dflt.%dflt
      this.<@class/ClassWithOtherCategory.ts: %AC2$%dflt.%dflt.a> = a
      %0 = new @class/ClassWithOtherCategory.ts: %AC3$%AC2$%dflt.%dflt.%instInit
      %0 = instanceinvoke %0.<@class/ClassWithOtherCategory.ts: %AC3$%AC2$%dflt.%dflt.%instInit.constructor()>()
      this.<@class/ClassWithOtherCategory.ts: %AC2$%dflt.%dflt.b> = %0
      return
  }
}
`;

export const SubObjClass = `object %AC3$%AC2$%dflt.%dflt.%instInit {
  value: number

  constructor(): @class/ClassWithOtherCategory.ts: %AC3$%AC2$%dflt.%dflt.%instInit {
    label0:
      this = this: @class/ClassWithOtherCategory.ts: %AC3$%AC2$%dflt.%dflt.%instInit
      instanceinvoke this.<@class/ClassWithOtherCategory.ts: %AC3$%AC2$%dflt.%dflt.%instInit.%instInit()>()
      return this
  }

  %instInit(): void {
    label0:
      this = this: @class/ClassWithOtherCategory.ts: %AC3$%AC2$%dflt.%dflt.%instInit
      this.<@class/ClassWithOtherCategory.ts: %AC3$%AC2$%dflt.%dflt.%instInit.value> = b
      return
  }
}
`;

export const New_Class_In_Default_Method = `%dflt(): void {
  label0:
    this = this: @class/class.ts: %dflt
    %0 = new @class/class.ts: TestClass
    %0 = instanceinvoke %0.<@class/class.ts: TestClass.constructor()>()
    testInstance = %0
    %1 = instanceinvoke testInstance.<@class/class.ts: TestClass.testMethod(number)>(123)
    instanceinvoke console.<@%unk/%unk: .log()>(%1)
    return
}
`;

export const New_Class_In_Function = `test(): void {
  label0:
    this = this: @class/class.ts: %dflt
    %0 = new @class/class.ts: TestClass
    %0 = instanceinvoke %0.<@class/class.ts: TestClass.constructor()>()
    testInstance = %0
    %1 = instanceinvoke testInstance.<@class/class.ts: TestClass.testMethod(string)>('abc')
    instanceinvoke console.<@%unk/%unk: .log()>(%1)
    return
}
`;

export const ClassAConstructorIR = `constructor(): @class/ClassWithHeritage.ts: A {
  label0:
    this = this: @class/ClassWithHeritage.ts: A
    instanceinvoke this.<@class/ClassWithHeritage.ts: A.%instInit()>()
    return this
}
`;

export const ClassBConstructorIR = `constructor(): @class/ClassWithHeritage.ts: B {
  label0:
    this = this: @class/ClassWithHeritage.ts: B
    instanceinvoke this.<@class/ClassWithHeritage.ts: A.constructor()>()
    instanceinvoke this.<@class/ClassWithHeritage.ts: B.%instInit()>()
    return this
}
`;

export const ClassCConstructorIR = `constructor(c: number): @class/ClassWithHeritage.ts: C {
  label0:
    c = parameter0: number
    this = this: @class/ClassWithHeritage.ts: C
    instanceinvoke this.<@class/ClassWithHeritage.ts: C.%instInit()>()
    this.<@class/ClassWithHeritage.ts: C.c> = c
    return this
}
`;

export const ClassDConstructorIR = `constructor(c: number): @class/ClassWithHeritage.ts: D {
  label0:
    c = parameter0: number
    this = this: @class/ClassWithHeritage.ts: D
    instanceinvoke this.<@class/ClassWithHeritage.ts: C.constructor(number)>(c)
    instanceinvoke this.<@class/ClassWithHeritage.ts: D.%instInit()>()
    return this
}
`;

export const ClassEConstructorIR = `constructor(c: number, e: string): @class/ClassWithHeritage.ts: E {
  label0:
    c = parameter0: number
    e = parameter1: string
    this = this: @class/ClassWithHeritage.ts: E
    instanceinvoke this.<@class/ClassWithHeritage.ts: C.constructor(number)>(c)
    instanceinvoke this.<@class/ClassWithHeritage.ts: E.%instInit()>()
    this.<@class/ClassWithHeritage.ts: E.e> = e
    return this
}
`;

export const ClassFConstructorIR = `constructor(f: string): @class/ClassWithHeritage.ts: F {
  label0:
    f = parameter0: string
    this = this: @class/ClassWithHeritage.ts: F
    instanceinvoke this.<@class/ClassWithConstructor.ts: O.constructor()>()
    instanceinvoke this.<@class/ClassWithHeritage.ts: F.%instInit()>()
    this.<@class/ClassWithHeritage.ts: F.f> = f
    return this
}
`;

export const ClassGConstructorIR = `constructor(c: number): @class/ClassWithHeritage.ts: G {
  label0:
    c = parameter0: number
    this = this: @class/ClassWithHeritage.ts: G
    instanceinvoke this.<@class/ClassWithHeritage.ts: D.constructor(number)>(c)
    instanceinvoke this.<@class/ClassWithHeritage.ts: G.%instInit()>()
    return this
}
`;

export const ClassHConstructorIR = `constructor(): @class/ClassWithHeritage.ts: H {
  label0:
    this = this: @class/ClassWithHeritage.ts: H
    instanceinvoke this.<@class/ClassWithHeritage.ts: H.%instInit()>()
    staticinvoke <@%unk/%unk: .super()>()
    return this
}
`;