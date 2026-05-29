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

import { Scene, SceneConfig, SourceClassPrinter, SourceFilePrinter, SourceNamespacePrinter } from '../../../src';
import { assert, describe, expect, it } from 'vitest';
import path from 'path';

const CASE1_EXPECT = `@Component
struct HelloGrandsonComponent {
  @Link
  message: string;
  build(): void {
    Row() {
      Text('HelloGrandsonComponent===' + this.message.toString())
      .fontSize(30)
      .fontWeight(FontWeight.Bold)
    }
  }
  static build(a: number): number {
    if (a != 0) {
      return 1;
    }
  }
}
`;

const CASE2_EXPECT = `namespace Case2 {
  class Tmp {
    paramA1: string = '';
  }
  @Builder
  function overBuilder($$: Tmp): void {
    Row() {
      Column() {
        Text('overBuilder===' + $$.paramA1.toString())
        HelloComponent({message: $$.paramA1})
      }
    }
  }
  @Component
  struct HelloComponent {
    @Link
    message: string;
    build(): void {
      Row() {
        Text('HelloComponent===' + this.message.toString())
      }
    }
  }
  @Entry
  @Component
  struct BuilderTest {
    @State
    label: string = 'Hello';
    build(): void {
      Column() {
        // Pass the this.label reference to the overBuilder component when the overBuilder component is called in the Parent component.
        overBuilder({paramA1: this.label});
        Button('Click me')
        .onClick((): void => {
        // After Click me is clicked, the UI text changes from Hello to ArkUI.
        this.label = 'ArkUI';
      })
      }
    }
  }
}
`;

const CASE3_EXPECT = `namespace Case3 {
  @Builder
  function overBuilder(paramA1: string): void {
    Row() {
      Text('UseStateVarByValue: ' + paramA1.toString() + ' ')
    }
  }
  @Entry
  @Component
  struct BuilderTest {
    @State
    label: string = 'Hello';
    build(): void {
      Column() {
        overBuilder(this.label);
      }
    }
  }
}
`;

const CASE4_EXPECT = `@Entry
@Component
struct LazyForEachTest {
  private moved: number[] = [];
  @State
  data: MyDataSource = new MyDataSource();
  aboutToAppear(): void {
    let i: number = 0;
    while (i <= 20) {
      this.data.pushData(new StringData(new NestedString('Hello ' + i.toString())));
      i = i + 1;
    }
  }
  build(): void {
    List({space: 3}) {
      LazyForEach(this.data, (item: StringData, index: number): void => {
      ListItem() {
        ChildComponent({data: item})
      }
      .onClick((): void => {
        item.message = new NestedString(item.message.message + '0');
      })
    }, (item: StringData, index: number) => {
      return JSON.stringify(item) + index.toString();
    })
    }
    .cachedCount(5)
  }
}
`;

const CASE5_EXPECT = `/*
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
@Entry
@Component
struct IfElseTest1 {
  @State
  toggle: boolean = false;
  @State
  toggleColor: boolean = false;
  build(): void {
    Column() {
      Text('Before')
      .fontSize(15)
      if (this.toggle != 0) {
        Text('Top True, positive 1 top')
        .backgroundColor('#aaffaa')
        .fontSize(20)
        if (this.toggleColor != 0) {
          Text('Top True, Nested True, positive COLOR  Nested ')
          .backgroundColor('#00aaaa')
          .fontSize(15)
        } else {
          Text('Top True, Nested False, Negative COLOR  Nested ')
          .backgroundColor('#aaaaff')
          .fontSize(15)
        }
      } else {
        Text('Top false, negative top level')
        .fontSize(20)
        .backgroundColor('#ffaaaa')
        if (this.toggleColor != 0) {
          Text('positive COLOR  Nested ')
          .backgroundColor('#00aaaa')
          .fontSize(15)
        } else {
          Text('Negative COLOR  Nested ')
          .backgroundColor('#aaaaff')
          .fontSize(15)
        }
      }
      Text('After')
      .fontSize(15)
      Button('Toggle Outer')
      .onClick((): void => {
      this.toggle = !this.toggle;
    })
      Button('Toggle Inner')
      .onClick((): void => {
      this.toggleColor = !this.toggleColor;
    })
    }
  }
}
`;

const CASE6_EXPECT = `@Entry
@Component
struct BuilderParamTest {
  @State
  text: string = 'header';
  build(): void {
    Column() {
      CustomContainer({header: this.text}) {
      Column() {
        specificParam('testA', 'testB');
      }
      .backgroundColor(Color.Yellow)
      .onClick((): void => {
        this.text = 'changeHeader';
      })
    }
    }
  }
}
`;

const CASE7_EXPECT = `namespace Case2 {
  @Component
  struct Child {
    label: string = 'Child';
    @Builder
    customBuilder(): void {
    }
    @Builder
    customChangeThisBuilder(): void {
    }
    @BuilderParam
    customBuilderParam: () => void  = this.customBuilder;
    @BuilderParam
    customChangeThisBuilderParam: () => void  = this.customChangeThisBuilder;
    build(): void {
      Column() {
        this.customBuilderParam();
        this.customChangeThisBuilderParam();
      }
    }
  }
  @Entry
  @Component
  struct BuilderParamTest {
    label: string = 'Parent';
    @Builder
    componentBuilder(): void {
      Text(this.label.toString())
    }
    build(): void {
      Column() {
        this.componentBuilder();
        Child({customBuilderParam: this.componentBuilder, customChangeThisBuilderParam: (): void => {
        this.componentBuilder();
      }})
      }
    }
  }
}
`;

const CASE8_EXPECT = `/*
 * Copyright (c) 2023 Huawei Device Co., Ltd.
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
import {common} from '@kit.AbilityKit';
import {resourceManager} from '@kit.LocalizationKit';
import {BusinessError} from '@kit.BasicServicesKit';
import {SongItem} from '../viewmodel/SongData';
import {Logger} from './Logger';
export default class SongItemBuilder {
  private context: common.UIAbilityContext | undefined = AppStorage.get('context');
  private realUrl?: resourceManager.RawFileDescriptor;
  private songItem: SongItem | null = null;
  public async build(songItem: SongItem): Promise<SongItem> {
    this.songItem = songItem;
    if (!this.context != 0) {
      return this.songItem;
    }
    let rawfileFd = await this.context.resourceManager.getRawFd(songItem.src).catch((error: BusinessError): void => {
      Logger.error('resourceManager error code ' + error.code.toString() + ' message ' + error.message.toString());
    });
    if (rawfileFd != 0) {
      this.realUrl = rawfileFd;
    } else {
      Logger.error('get rawfileFd failed');
    }
    Logger.info('MediaAssetBuilder build realUrl:' + this.realUrl);
    return this.songItem;
  }
  public getRealUrl(): resourceManager.RawFileDescriptor | undefined {
    Logger.info('url ' + this.realUrl.toString());
    return this.realUrl;
  }
  public async release(): Promise<void> {
    if (this.context != 0) {
      if (this.context !== null) {
        if (this.songItem !== null) {
          this.context.resourceManager.closeRawFd(this.songItem.src);
        }
      }
    }
    this.songItem = null;
  }
}
`;

describe('SourceViewTreeTest', () => {
    let config: SceneConfig = new SceneConfig({enableLeadingComments: true});
    config.buildFromProjectDir(path.join(__dirname, '../../resources/viewtree'));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferSimpleTypes();

    it('case1: class build', () => {
        let arkfile = scene.getFiles().find((value) => {
            return value.getName().endsWith('BuilderTest.ets');
        });

        let cls = arkfile?.getClassWithName('HelloGrandsonComponent');
        if (!cls) {
            assert.isDefined(cls);
            return;
        }
        let printer = new SourceClassPrinter(cls);
        let source = printer.dump();
        expect(source).eq(CASE1_EXPECT);
    });

    it('case2: class Decorator', () => {
        let arkfile = scene.getFiles().find((value) => {
            return value.getName().endsWith('BuilderTest.ets');
        });

        let ns = arkfile?.getNamespaceWithName('Case2');
        if (!ns) {
            assert.isDefined(ns);
            return;
        }
        let printer = new SourceNamespacePrinter(ns);
        let source = printer.dump();
        expect(source).eq(CASE2_EXPECT);
    });

    it('case3: class Decorator', () => {
        let arkfile = scene.getFiles().find((value) => {
            return value.getName().endsWith('BuilderTest.ets');
        });

        let ns = arkfile?.getNamespaceWithName('Case3');
        if (!ns) {
            assert.isDefined(ns);
            return;
        }
        let printer = new SourceNamespacePrinter(ns);
        let source = printer.dump();
        expect(source).eq(CASE3_EXPECT);
    });

    it('case4: LazyForEachTest', () => {
        let arkfile = scene.getFiles().find((value) => {
            return value.getName().endsWith('LazyForEachTest.ets');
        });

        let cls = arkfile?.getClassWithName('LazyForEachTest');
        if (!cls) {
            assert.isDefined(cls);
            return;
        }

        let printer = new SourceClassPrinter(cls);
        let source = printer.dump();
        expect(source).eq(CASE4_EXPECT);
    });

    it('case5: IfTest', () => {
        let arkfile = scene.getFiles().find((value) => {
            return value.getName().endsWith('IfElseTest1.ets');
        });

        let cls = arkfile?.getClassWithName('IfElseTest1');
        if (!cls) {
            assert.isDefined(cls);
            return;
        }

        let printer = new SourceClassPrinter(cls);
        let source = printer.dump();
        expect(source).eq(CASE5_EXPECT);
    });

    it('case6: BuilderParam', () => {
        let arkfile = scene.getFiles().find((value) => {
            return value.getName().endsWith('BuilderParamTest.ets');
        });

        let cls = arkfile?.getClassWithName('BuilderParamTest');
        if (!cls) {
            assert.isDefined(cls);
            return;
        }

        let printer = new SourceClassPrinter(cls);
        let source = printer.dump();
        expect(source).eq(CASE6_EXPECT);
    });

    it('case7: BuilderParam ns', () => {
        let arkfile = scene.getFiles().find((value) => {
            return value.getName().endsWith('BuilderParamTest.ets');
        });

        let ns = arkfile?.getNamespaceWithName('Case2');
        if (!ns) {
            assert.isDefined(ns);
            return;
        }
        let printer = new SourceNamespacePrinter(ns);
        let source = printer.dump();
        expect(source).eq(CASE7_EXPECT);
    });

    it('case8: normal build', () => {
        let arkfile = scene.getFiles().find((value) => {
            return value.getName().endsWith('SongItemBuilder.ets');
        });
        if (!arkfile) {
            assert.isDefined(arkfile);
            return;
        }

        let printer = new SourceFilePrinter(arkfile);
        let source = printer.dump();
        if (source !== CASE8_EXPECT) {
            console.log('unit test failed: SourceViewTreeTest case8');
        }
    });
});
