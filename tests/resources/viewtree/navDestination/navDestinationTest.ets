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
 
@Entry
@Component
struct navDestinationTest {
  @Provide stack: NavPathStack = new NavPathStack()
  @Provide homePageTransitionType: NavigationSystemTransitionType = NavigationSystemTransitionType.DEFAULT;


  @Builder
  pageMap(name: string) {
    if (name === 'Fade') {
      Fade();
    } else if (name === 'Explode') {
      Explode();
    }
  }


  aboutToAppear(): void {
    this.stack.pushPath({name: 'Dest'});
  }


  build() {
    Navigation(this.stack) {
      // empty
    }
    .navDestination(this.pageMap)
    .hideNavBar(true)
  }
}


@Component
struct Dest {
  @Consume stack: NavPathStack;
  @Consume homePageTransitionType: NavigationSystemTransitionType;
  @State name: string = 'NA';


  build() {
    Stack();
  }
}


@Component
struct Fade {
  @Consume stack: NavPathStack;
  @State name: string = 'NA';


  build() {
    Column();
  }
}


@Component
struct Explode {
  @Consume stack: NavPathStack;
  @State name: string = 'NA';


  build() {
    Row();
  }
}


@Component
struct SlideRight {
  @Consume stack: NavPathStack;
  @State name: string = 'NA';


  build() {
    Button();
  }
}


@Component
struct SlideBottom {
  @Consume stack: NavPathStack;
  @State name: string = 'NA';


  build() {
    Search();
  }
}

