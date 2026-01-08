/*
 * Copyright (c) 2024-2026 Huawei Device Co., Ltd.
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

import { Printer, Scene, SceneConfig } from '../../../src/index';
import { describe, expect, it } from 'vitest';
import path from 'path';
import { ArkIRFilePrinter } from '../../../src/save/arkir/ArkIRFilePrinter';

const CASE1_EXPECT = `class %dflt {
  forLoopTest(): void {
    label0:
      this = this: @save/basic.ts: %dflt
      %0 = new @save/basic.ts: Person
      %0 = instanceinvoke %0.<@save/basic.ts: Person.constructor(number)>(10)
      myPerson = %0
      i = 0
      goto label1

    label1:
      if i < 10 goto label2 label3

    label2:
      %1 = myPerson.<@save/basic.ts: Person.age>
      newAge = %1 + i
      instanceinvoke logger.<@%unk/%unk: .info()>(newAge)
      i = i + 1
      goto label1

    label3:
      return
  }

  controlTest(): void {
    label0:
      this = this: @save/basic.ts: %dflt
      %0 = newarray (number)[5]
      %0[0] = 1
      %0[1] = 2
      %0[2] = 3
      %0[3] = 4
      %0[4] = 5
      sampleData = %0
      i = 0
      goto label1

    label1:
      %1 = sampleData.<@built-in/lib.es5.d.ts: Array.length>
      if i < %1 goto label2 label13

    label2:
      %2 = sampleData[i]
      %3 = %2 % 2
      if %3 === 0 goto label3 label4

    label3:
      %4 = sampleData[i]
      %5 = instanceinvoke %4.<@built-in/lib.es5.d.ts: Number.toString(number)>()
      %6 = %5 + ' 是偶数'
      instanceinvoke logger.<@%unk/%unk: .info()>(%6)
      goto label5

    label5:
      count = 0
      goto label6

    label6:
      %10 = sampleData[i]
      if count < %10 goto label7 label15

    label7:
      %11 = instanceinvoke count.<@built-in/lib.es5.d.ts: Number.toString(number)>()
      %12 = '当前计数: ' + %11
      instanceinvoke logger.<@%unk/%unk: .info()>(%12)
      count = count + 1
      goto label6

    label15:
      j = 0
      goto label8

    label8:
      if j < 5 goto label9 label17

    label9:
      if j === 2 goto label16 label10

    label16:
      j = j + 1
      goto label8

    label10:
      %13 = instanceinvoke j.<@built-in/lib.es5.d.ts: Number.toString(number)>()
      %14 = '当前内层循环计数: ' + %13
      instanceinvoke logger.<@%unk/%unk: .info()>(%14)
      goto label16

    label17:
      k = 0
      goto label11

    label11:
      if k < 3 goto label12 label14

    label12:
      %15 = instanceinvoke k.<@built-in/lib.es5.d.ts: Number.toString(number)>()
      %16 = '外层循环计数: ' + %15
      instanceinvoke logger.<@%unk/%unk: .info()>(%16)
      %17 = 'Department name: ' + k
      instanceinvoke logger.<@%unk/%unk: .info()>(%17)
      if k === 1 goto label14 label18

    label14:
      i = i + 1
      goto label1

    label18:
      k = k + 1
      goto label11

    label4:
      %7 = sampleData[i]
      %8 = instanceinvoke %7.<@built-in/lib.es5.d.ts: Number.toString(number)>()
      %9 = %8 + ' 是奇数'
      instanceinvoke logger.<@%unk/%unk: .info()>(%9)
      goto label5

    label13:
      return
  }

  export classMethodTest(): void {
    label0:
      this = this: @save/basic.ts: %dflt
      %0 = new @save/basic.ts: Person
      %0 = instanceinvoke %0.<@save/basic.ts: Person.constructor(number)>(10)
      notPerson = %0
      %1 = new @built-in/lib.es2015.collection.d.ts: Map
      %1 = instanceinvoke %1.<@built-in/lib.es2015.collection.d.ts: MapConstructor.construct-signature()>()
      x = %1
      %2 = new @built-in/lib.es5.d.ts: Error
      %2 = instanceinvoke %2.<@built-in/lib.es5.d.ts: ErrorConstructor.construct-signature(string)>()
      z = %2
      y = staticinvoke <@save/basic.ts: %dflt.controlTest()>()
      a = notPerson.<@save/basic.ts: Person.age>
      ptrinvoke notPerson.growOld<@save/basic.ts: Person.%AM0$%instInit()>()
      staticinvoke <@save/basic.ts: Person.[static]wooooof()>()
      return
  }

  export foo(x: number): number {
    label0:
      x = parameter0: number
      this = this: @save/basic.ts: %dflt
      y = 0
      k = 0
      goto label1

    label1:
      if k < x goto label2 label3

    label2:
      y = y + k
      k = k + 1
      goto label1

    label3:
      return y
  }

  export listParameters(u: number, v: number, w: string): @save/basic.ts: %AC0 {
    label0:
      u = parameter0: number
      v = parameter1: number
      w = parameter2: string
      this = this: @save/basic.ts: %dflt
      %0 = new @save/basic.ts: %AC9$%dflt-listParameters
      %0 = instanceinvoke %0.<@save/basic.ts: %AC9$%dflt-listParameters.constructor()>()
      return %0
  }

  deleteTest(): void {
    label0:
      this = this: @save/basic.ts: %dflt
      %0 = new @save/basic.ts: %AC11$%dflt-deleteTest
      %0 = instanceinvoke %0.<@save/basic.ts: %AC11$%dflt-deleteTest.constructor()>()
      x = %0
      bbb = x.<@save/basic.ts: %AC11$%dflt-deleteTest.b>
      %1 = delete x.<@save/basic.ts: %AC11$%dflt-deleteTest.a>
      %2 = delete bbb[0]
      instanceinvoke logger.<@%unk/%unk: .info()>(x)
      %3 = delete x
      return
  }

  async * yieldTest(): unknown {
    label0:
      this = this: @save/basic.ts: %dflt
      %0 = yield 1
      %1 = yield 2
      %2 = yield 3
      return
  }

  %dflt(): void {
    label0:
      this = this: @save/basic.ts: %dflt
      %0 = new @save/basic.ts: %AC2$%dflt-%dflt
      %0 = instanceinvoke %0.<@save/basic.ts: %AC2$%dflt-%dflt.constructor()>()
      staticinvoke <@%unk/%unk: .configure()>(%0)
      logger = staticinvoke <@%unk/%unk: .getLogger()>()
      someClass = %AC8$%dflt-%dflt
      %1 = new @save/basic.ts: %AC8$%dflt-%dflt
      %1 = instanceinvoke %1.<@save/basic.ts: %AC8$%dflt-%dflt.constructor(Type)>('Hello, world')
      m = %1
      %2 = staticinvoke <@save/basic.ts: %dflt.yieldTest()>()
      iterator = await %2
      x = 1
      soo = 123
      staticinvoke <@save/basic.ts: %dflt.forLoopTest()>()
      staticinvoke <@save/basic.ts: %dflt.controlTest()>()
      staticinvoke <@save/basic.ts: %dflt.deleteTest()>()
      return
  }

  dealColor(rRGB: number, gRGB: number, bRGB: number): void {
    label0:
      rRGB = parameter0: number
      gRGB = parameter1: number
      bRGB = parameter2: number
      this = this: @save/basic.ts: %dflt
      %0 = instanceinvoke Math.<@built-in/lib.es5.d.ts: Math.max(number[])>(rRGB, gRGB)
      max = instanceinvoke Math.<@built-in/lib.es5.d.ts: Math.max(number[])>(%0, bRGB)
      %1 = instanceinvoke Math.<@built-in/lib.es5.d.ts: Math.min(number[])>(rRGB, gRGB)
      min = instanceinvoke Math.<@built-in/lib.es5.d.ts: Math.min(number[])>(%1, bRGB)
      bHSB = max / 255
      hHSB = 0
      %2 = max === rRGB
      %3 = gRGB >= bRGB
      %4 = %2 && %3
      if %4 != false goto label1 label2

    label1:
      %5 = gRGB - bRGB
      %6 = 60 * %5
      %7 = max - min
      %8 = %6 / %7
      hHSB = %8 + 0
      goto label2

    label2:
      %9 = max === rRGB
      %10 = gRGB < bRGB
      %11 = %9 && %10
      if %11 != false goto label3 label4

    label3:
      %12 = gRGB - bRGB
      %13 = 60 * %12
      %14 = max - min
      %15 = %13 / %14
      hHSB = %15 + 360
      goto label4

    label4:
      if max === gRGB goto label5 label6

    label5:
      %16 = bRGB - rRGB
      %17 = 60 * %16
      %18 = max - min
      %19 = %17 / %18
      hHSB = %19 + 120
      goto label6

    label6:
      if max === bRGB goto label7 label8

    label7:
      %20 = rRGB - gRGB
      %21 = 60 * %20
      %22 = max - min
      %23 = %21 / %22
      hHSB = %23 + 240
      goto label8

    label8:
      if bHSB >= 0.4 goto label9 label10

    label9:
      bHSB = 0.3
      goto label13

    label13:
      return

    label10:
      if bHSB >= 0.2 goto label11 label12

    label11:
      bHSB = bHSB - 0.1
      goto label13

    label12:
      bHSB = bHSB + 0.2
      goto label13
  }

  specialString(text: string): void {
    label0:
      text = parameter0: string
      this = this: @save/basic.ts: %dflt
      %0 = new @built-in/lib.es5.d.ts: RegExp
      %0 = instanceinvoke %0.<@built-in/lib.es5.d.ts: RegExpConstructor.construct-signature(string, string)>('\\[\\d{2,}:\\d{2}((\\.|:)\\d{2,})\\]', 'g')
      lrcLineRegex = %0
      %1 = new @built-in/lib.es5.d.ts: RegExp
      %1 = instanceinvoke %1.<@built-in/lib.es5.d.ts: RegExpConstructor.construct-signature(string, string)>('\\[\\d{2,}', 'i')
      lrcTimeRegex1 = %1
      %2 = new @built-in/lib.es5.d.ts: RegExp
      %2 = instanceinvoke %2.<@built-in/lib.es5.d.ts: RegExpConstructor.construct-signature(string, string)>('\\d{2}\\.\\d{2,}', 'i')
      lrcTimeRegex2 = %2
      lyric = instanceinvoke text.<@built-in/lib.es5.d.ts: String.split(string|@built-in/lib.es5.d.ts: RegExp, number)>('\n')
      return
  }

  dotDotDotTokenTest(...args: string[]): void {
    label0:
      args = parameter0: string[]
      this = this: @save/basic.ts: %dflt
      return
  }
}
/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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
import {configure, getLogger} from 'log4js';
object %AC2$%dflt-%dflt {
  appenders: @save/basic.ts: %AC3$%AC2$%dflt-%dflt-%instInit
  categories: @save/basic.ts: %AC6$%AC2$%dflt-%dflt-%instInit

  constructor(): @save/basic.ts: %AC2$%dflt-%dflt {
    label0:
      this = this: @save/basic.ts: %AC2$%dflt-%dflt
      instanceinvoke this.<@save/basic.ts: %AC2$%dflt-%dflt.%instInit()>()
      return this
  }

  %instInit(): void {
    label0:
      this = this: @save/basic.ts: %AC2$%dflt-%dflt
      %0 = new @save/basic.ts: %AC3$%AC2$%dflt-%dflt-%instInit
      %0 = instanceinvoke %0.<@save/basic.ts: %AC3$%AC2$%dflt-%dflt-%instInit.constructor()>()
      this.<@save/basic.ts: %AC2$%dflt-%dflt.appenders> = %0
      %1 = new @save/basic.ts: %AC6$%AC2$%dflt-%dflt-%instInit
      %1 = instanceinvoke %1.<@save/basic.ts: %AC6$%AC2$%dflt-%dflt-%instInit.constructor()>()
      this.<@save/basic.ts: %AC2$%dflt-%dflt.categories> = %1
      return
  }
}
object %AC3$%AC2$%dflt-%dflt-%instInit {
  console: @save/basic.ts: %AC4$%AC3$%AC2$%dflt-%dflt-%instInit-%instInit

  constructor(): @save/basic.ts: %AC3$%AC2$%dflt-%dflt-%instInit {
    label0:
      this = this: @save/basic.ts: %AC3$%AC2$%dflt-%dflt-%instInit
      instanceinvoke this.<@save/basic.ts: %AC3$%AC2$%dflt-%dflt-%instInit.%instInit()>()
      return this
  }

  %instInit(): void {
    label0:
      this = this: @save/basic.ts: %AC3$%AC2$%dflt-%dflt-%instInit
      %0 = new @save/basic.ts: %AC4$%AC3$%AC2$%dflt-%dflt-%instInit-%instInit
      %0 = instanceinvoke %0.<@save/basic.ts: %AC4$%AC3$%AC2$%dflt-%dflt-%instInit-%instInit.constructor()>()
      this.<@save/basic.ts: %AC3$%AC2$%dflt-%dflt-%instInit.console> = %0
      return
  }
}
object %AC4$%AC3$%AC2$%dflt-%dflt-%instInit-%instInit {
  type: string
  layout: @save/basic.ts: %AC5$%AC4$%AC3$%AC2$%dflt-%dflt-%instInit-%instInit-%instInit

  constructor(): @save/basic.ts: %AC4$%AC3$%AC2$%dflt-%dflt-%instInit-%instInit {
    label0:
      this = this: @save/basic.ts: %AC4$%AC3$%AC2$%dflt-%dflt-%instInit-%instInit
      instanceinvoke this.<@save/basic.ts: %AC4$%AC3$%AC2$%dflt-%dflt-%instInit-%instInit.%instInit()>()
      return this
  }

  %instInit(): void {
    label0:
      this = this: @save/basic.ts: %AC4$%AC3$%AC2$%dflt-%dflt-%instInit-%instInit
      this.<@save/basic.ts: %AC4$%AC3$%AC2$%dflt-%dflt-%instInit-%instInit.type> = 'console'
      %0 = new @save/basic.ts: %AC5$%AC4$%AC3$%AC2$%dflt-%dflt-%instInit-%instInit-%instInit
      %0 = instanceinvoke %0.<@save/basic.ts: %AC5$%AC4$%AC3$%AC2$%dflt-%dflt-%instInit-%instInit-%instInit.constructor()>()
      this.<@save/basic.ts: %AC4$%AC3$%AC2$%dflt-%dflt-%instInit-%instInit.layout> = %0
      return
  }
}
object %AC5$%AC4$%AC3$%AC2$%dflt-%dflt-%instInit-%instInit-%instInit {
  type: string
  pattern: string

  constructor(): @save/basic.ts: %AC5$%AC4$%AC3$%AC2$%dflt-%dflt-%instInit-%instInit-%instInit {
    label0:
      this = this: @save/basic.ts: %AC5$%AC4$%AC3$%AC2$%dflt-%dflt-%instInit-%instInit-%instInit
      instanceinvoke this.<@save/basic.ts: %AC5$%AC4$%AC3$%AC2$%dflt-%dflt-%instInit-%instInit-%instInit.%instInit()>()
      return this
  }

  %instInit(): void {
    label0:
      this = this: @save/basic.ts: %AC5$%AC4$%AC3$%AC2$%dflt-%dflt-%instInit-%instInit-%instInit
      this.<@save/basic.ts: %AC5$%AC4$%AC3$%AC2$%dflt-%dflt-%instInit-%instInit-%instInit.type> = 'pattern'
      this.<@save/basic.ts: %AC5$%AC4$%AC3$%AC2$%dflt-%dflt-%instInit-%instInit-%instInit.pattern> = '[%d] [%p] [%z] [ArkAnalyzer] - %m'
      return
  }
}
object %AC6$%AC2$%dflt-%dflt-%instInit {
  default: @save/basic.ts: %AC7$%AC6$%AC2$%dflt-%dflt-%instInit-%instInit

  constructor(): @save/basic.ts: %AC6$%AC2$%dflt-%dflt-%instInit {
    label0:
      this = this: @save/basic.ts: %AC6$%AC2$%dflt-%dflt-%instInit
      instanceinvoke this.<@save/basic.ts: %AC6$%AC2$%dflt-%dflt-%instInit.%instInit()>()
      return this
  }

  %instInit(): void {
    label0:
      this = this: @save/basic.ts: %AC6$%AC2$%dflt-%dflt-%instInit
      %0 = new @save/basic.ts: %AC7$%AC6$%AC2$%dflt-%dflt-%instInit-%instInit
      %0 = instanceinvoke %0.<@save/basic.ts: %AC7$%AC6$%AC2$%dflt-%dflt-%instInit-%instInit.constructor()>()
      this.<@save/basic.ts: %AC6$%AC2$%dflt-%dflt-%instInit.default> = %0
      return
  }
}
object %AC7$%AC6$%AC2$%dflt-%dflt-%instInit-%instInit {
  appenders: string[]
  level: string
  enableCallStack: boolean

  constructor(): @save/basic.ts: %AC7$%AC6$%AC2$%dflt-%dflt-%instInit-%instInit {
    label0:
      this = this: @save/basic.ts: %AC7$%AC6$%AC2$%dflt-%dflt-%instInit-%instInit
      instanceinvoke this.<@save/basic.ts: %AC7$%AC6$%AC2$%dflt-%dflt-%instInit-%instInit.%instInit()>()
      return this
  }

  %instInit(): void {
    label0:
      this = this: @save/basic.ts: %AC7$%AC6$%AC2$%dflt-%dflt-%instInit-%instInit
      %0 = newarray (string)[1]
      %0[0] = 'console'
      this.<@save/basic.ts: %AC7$%AC6$%AC2$%dflt-%dflt-%instInit-%instInit.appenders> = %0
      this.<@save/basic.ts: %AC7$%AC6$%AC2$%dflt-%dflt-%instInit-%instInit.level> = 'info'
      this.<@save/basic.ts: %AC7$%AC6$%AC2$%dflt-%dflt-%instInit-%instInit.enableCallStack> = false
      return
  }
}
class Person {
  x: number
  public age: number
  growOld: @save/basic.ts: Person.%AM0$%instInit()

  static %statInit(): void {
    label0:
      this = this: @save/basic.ts: Person
      return
  }

  constructor(age: number): @save/basic.ts: Person {
    label0:
      age = parameter0: number
      this = this: @save/basic.ts: Person
      instanceinvoke this.<@save/basic.ts: Person.%instInit()>()
      this.<@save/basic.ts: Person.age> = age
      return this
  }

  %instInit(): void {
    label0:
      this = this: @save/basic.ts: Person
      this.<@save/basic.ts: Person.x> = 0
      this.<@save/basic.ts: Person.growOld> = %AM0$%instInit
      return
  }

  %AM0$%instInit(): void {
    label0:
      this = this: @save/basic.ts: Person
      %0 = this.<@save/basic.ts: Person.age>
      %0 = %0 + 1
      this.<@save/basic.ts: Person.age> = %0
      return
  }

  public getAge(): number {
    label0:
      this = this: @save/basic.ts: Person
      %0 = this.<@save/basic.ts: Person.age>
      return %0
  }

  static wooooof(): void {
    label0:
      this = this: @save/basic.ts: Person
      instanceinvoke logger.<@%unk/%unk: .info()>('not a person sound')
      return
  }
}
interface Alarm {
  alert(): void
}
interface Alarm2 {
  alert2(): void
}
class Door {
  %instInit(): void {
    label0:
      this = this: @save/basic.ts: Door
      return
  }

  constructor(): @save/basic.ts: Door {
    label0:
      this = this: @save/basic.ts: Door
      instanceinvoke this.<@save/basic.ts: Door.%instInit()>()
      return this
  }

  static %statInit(): void {
    label0:
      this = this: @save/basic.ts: Door
      return
  }
}
class Adder {
  public a: number
  // This function is now safe to pass around
  add: @save/basic.ts: Adder.%AM0$%instInit(string)

  static %statInit(): void {
    label0:
      this = this: @save/basic.ts: Adder
      return
  }

  constructor(a: number): @save/basic.ts: Adder {
    label0:
      a = parameter0: number
      this = this: @save/basic.ts: Adder
      instanceinvoke this.<@save/basic.ts: Adder.%instInit()>()
      this.<@save/basic.ts: Adder.a> = a
      return this
  }

  %instInit(): void {
    label0:
      this = this: @save/basic.ts: Adder
      this.<@save/basic.ts: Adder.add> = %AM0$%instInit
      return
  }

  %AM0$%instInit(b: string): string {
    label0:
      b = parameter0: string
      this = this: @save/basic.ts: Adder
      %0 = this.<@save/basic.ts: Adder.a>
      %1 = %0 + b
      return %1
  }
}
class ExtendedAdder extends Adder {
  // Create a copy of parent before creating our own
  private superAdd: @save/basic.ts: ExtendedAdder.%AM0$%instInit(string)
  // Now create our override
  add: @save/basic.ts: ExtendedAdder.%AM0$%instInit(string)

  constructor(a: number): @save/basic.ts: ExtendedAdder {
    label0:
      a = parameter0: number
      this = this: @save/basic.ts: ExtendedAdder
      instanceinvoke this.<@save/basic.ts: Adder.constructor(number)>(a)
      instanceinvoke this.<@save/basic.ts: ExtendedAdder.%instInit()>()
      return this
  }

  static %statInit(): void {
    label0:
      this = this: @save/basic.ts: ExtendedAdder
      return
  }

  %instInit(): void {
    label0:
      this = this: @save/basic.ts: ExtendedAdder
      %0 = this.<@save/basic.ts: ExtendedAdder.add>
      this.<@save/basic.ts: ExtendedAdder.superAdd> = %0
      this.<@save/basic.ts: ExtendedAdder.add> = %AM0$%instInit
      return
  }

  %AM0$%instInit(b: string): string {
    label0:
      b = parameter0: string
      this = this: @save/basic.ts: ExtendedAdder
      %0 = ptrinvoke this.superAdd<@save/basic.ts: ExtendedAdder.%AM0$%instInit(string)>(b)
      return %0
  }
}
typeliteral %AC0 {
  x: number
  y: number
  z: string
}
object %AC9$%dflt-listParameters {
  x: number
  y: number
  z: string

  constructor(): @save/basic.ts: %AC9$%dflt-listParameters {
    label0:
      this = this: @save/basic.ts: %AC9$%dflt-listParameters
      instanceinvoke this.<@save/basic.ts: %AC9$%dflt-listParameters.%instInit()>()
      return this
  }

  %instInit(): void {
    label0:
      this = this: @save/basic.ts: %AC9$%dflt-listParameters
      this.<@save/basic.ts: %AC9$%dflt-listParameters.x> = u
      this.<@save/basic.ts: %AC9$%dflt-listParameters.y> = v
      this.<@save/basic.ts: %AC9$%dflt-listParameters.z> = w
      return
  }
}
export class SecurityDoor extends Door implements Alarm, Alarm2 {
  x: number
  y: string
  z: @save/basic.ts: Person
  public Members: @save/basic.ts: %AC1$SecurityDoor-%instInit

  static %statInit(): void {
    label0:
      this = this: @save/basic.ts: SecurityDoor
      return
  }

  alert(): void {
    label0:
      this = this: @save/basic.ts: SecurityDoor
      instanceinvoke logger.<@%unk/%unk: .info()>('SecurityDoor alert')
      return
  }

  alert2(): void {
    label0:
      this = this: @save/basic.ts: SecurityDoor
      instanceinvoke logger.<@%unk/%unk: .info()>('SecurityDoor alert2')
      return
  }

  %instInit(): void {
    label0:
      this = this: @save/basic.ts: SecurityDoor
      this.<@save/basic.ts: SecurityDoor.x> = 0
      this.<@save/basic.ts: SecurityDoor.y> = ''
      %0 = new @save/basic.ts: Person
      %0 = instanceinvoke %0.<@save/basic.ts: Person.constructor(number)>(10)
      this.<@save/basic.ts: SecurityDoor.z> = %0
      this.<@save/basic.ts: SecurityDoor.Members> = %AC1$SecurityDoor-%instInit
      return
  }

  public fooo(): void {
    label0:
      this = this: @save/basic.ts: SecurityDoor
      instanceinvoke logger.<@%unk/%unk: .info()>('This is fooo!')
      return
  }

  constructor(x: number, y: string): @save/basic.ts: SecurityDoor {
    label0:
      x = parameter0: number
      y = parameter1: string
      this = this: @save/basic.ts: SecurityDoor
      instanceinvoke this.<@save/basic.ts: Door.constructor()>()
      instanceinvoke this.<@save/basic.ts: SecurityDoor.%instInit()>()
      this.<@save/basic.ts: SecurityDoor.x> = x
      this.<@save/basic.ts: SecurityDoor.y> = y
      instanceinvoke logger.<@%unk/%unk: .info()>('This is a constrctor!')
      return this
  }
}
class %AC1$SecurityDoor-%instInit {
  %instInit(): void {
    label0:
      this = this: @save/basic.ts: %AC1$SecurityDoor-%instInit
      return
  }

  constructor(): @save/basic.ts: %AC1$SecurityDoor-%instInit {
    label0:
      this = this: @save/basic.ts: %AC1$SecurityDoor-%instInit
      instanceinvoke this.<@save/basic.ts: %AC1$SecurityDoor-%instInit.%instInit()>()
      return this
  }

  static %statInit(): void {
    label0:
      this = this: @save/basic.ts: %AC1$SecurityDoor-%instInit
      return
  }
}
class %AC8$%dflt-%dflt<Type> {
  content: Type

  %instInit(): void {
    label0:
      this = this: @save/basic.ts: %AC8$%dflt-%dflt
      return
  }

  static %statInit(): void {
    label0:
      this = this: @save/basic.ts: %AC8$%dflt-%dflt
      return
  }

  constructor(value: Type): @save/basic.ts: %AC8$%dflt-%dflt {
    label0:
      value = parameter0: Type
      this = this: @save/basic.ts: %AC8$%dflt-%dflt
      instanceinvoke this.<@save/basic.ts: %AC8$%dflt-%dflt.%instInit()>()
      this.<@save/basic.ts: %AC8$%dflt-%dflt.content> = value
      return this
  }
}
abstract class Animal {
  public name: string

  %instInit(): void {
    label0:
      this = this: @save/basic.ts: Animal
      return
  }

  static %statInit(): void {
    label0:
      this = this: @save/basic.ts: Animal
      return
  }

  public abstract sayHi(): void

  public constructor(name: string): @save/basic.ts: Animal {
    label0:
      name = parameter0: string
      this = this: @save/basic.ts: Animal
      instanceinvoke this.<@save/basic.ts: Animal.%instInit()>()
      this.<@save/basic.ts: Animal.name> = name
      return this
  }
}
typeliteral %AC10 {
  a?: number
  b: number[]
}
object %AC11$%dflt-deleteTest {
  a: number
  b: number[]

  constructor(): @save/basic.ts: %AC11$%dflt-deleteTest {
    label0:
      this = this: @save/basic.ts: %AC11$%dflt-deleteTest
      instanceinvoke this.<@save/basic.ts: %AC11$%dflt-deleteTest.%instInit()>()
      return this
  }

  %instInit(): void {
    label0:
      this = this: @save/basic.ts: %AC11$%dflt-deleteTest
      this.<@save/basic.ts: %AC11$%dflt-deleteTest.a> = 42
      %0 = newarray (number)[2]
      %0[0] = 5
      %0[1] = 100
      this.<@save/basic.ts: %AC11$%dflt-deleteTest.b> = %0
      return
  }
}
export {default};
export interface StringValidator {
  color?: string
  width?: number

  isAcceptable(s?: string): boolean
}
export {ExtendedAdder as ExtAdder};
export {ExtendedAdder};
`;


describe('ArkIRPrinterTest', () => {
    let config: SceneConfig = new SceneConfig({enableLeadingComments: true});
    config.buildFromProjectDir(path.join(__dirname, '../../resources/save'));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();

    let arkfile = scene.getFiles().find((value) => {
        return value.getName().endsWith('basic.ts');
    });

    it('case1: ', () => {
        let printer: Printer = new ArkIRFilePrinter(arkfile!);
        let ir = printer.dump();
        expect(ir).eq(CASE1_EXPECT);
    });
});
