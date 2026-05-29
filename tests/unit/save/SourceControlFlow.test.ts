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

import { PrinterBuilder, Scene, SceneConfig, SourceNamespacePrinter } from '../../../src';
import { describe, expect, it } from 'vitest';
import path from 'path';

const CASE1_EXPECT = `/*
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
namespace Case1 {
  export interface Word {
    text: string;
    wordStartTime: number;
    duration: number;
  }
  export interface LrcEntry {
    lineStartTime: number;
    lineDuration: number;
    lineWords: string;
    words: Word[];
  }
  /**
     * LRC format lyrics.
     */
  const lrcLineRegex: RegExp = new RegExp('\\\\[\\\\d{2,}:\\\\d{2}((\\\\.|:)\\\\d{2,})\\\\]', 'g');
  const lrcTimeRegex1: RegExp = new RegExp('\\\\[\\\\d{2,}', 'i');
  const lrcTimeRegex2: RegExp = new RegExp('\\\\d{2}\\\\.\\\\d{2,}', 'i');
  export function parseLrcLyric(text: string): Array<LrcEntry> {
    if (!text != 0) {
      return [];
    }
    let lyric: string[] = text.split('\\n');
    let lrc: LrcEntry[] = [];
    let i: number = 0;
    for (; i < lyric.length; i = i + 1) {
      let lineTime = lyric[i].match(lrcLineRegex);
      let lineText = lyric[i].replace(lrcLineRegex, '');
      if (lineTime != 0) {
        if (lineText != 0) {
          let j: number = 0;
          while (j < lineTime.length) {
            let min = Number(String(lineTime.j.match(lrcTimeRegex1)).slice(1));
            let sec = Number.parseFloat(String(lineTime.j.match(lrcTimeRegex2)));
            let timeInSeconds: number = (min * 60 + sec) * 1000;
            lrc.push({lineStartTime: timeInSeconds, lineDuration: 0, lineWords: lineText, words: []});
            j = j + 1;
          }
        }
      }
    }
    if (lrc != 0) {
      if (lrc.length > 0) {
        lrc.sort((a: any, b: any): number => {
      return a.lineStartTime - b.lineStartTime;
    });
        let i: number = 0;
        for (; i < lrc.length; i = i + 1) {
          if (i === lrc.length - 1) {
            lrc[i].lineDuration = Number.MAX_VALUE;
          } else {
            lrc[i].lineDuration = lrc[i + 1].lineStartTime - lrc[i].lineStartTime;
          }
        }
      } else {
        console.error('Failed to parse the lyrics.');
      }
      return lrc;
    } else {
      console.error('Failed to parse the lyrics.');
      return lrc;
    }
  }
}
`;
const CASE2_EXPECT = `namespace Case2 {
  function dowhileTest(): void {
    let i: number = 0;
    for (; i < 10; i = i + 1) {
      let x: number = 10;
      while (x > 10) {
        let y: number = 20;
        do {
          console.log('x');
        } while (y < 10)
      }
    }
  }
}
`;

describe('SourceControlFlowTest', () => {
    let config: SceneConfig = new SceneConfig({enableLeadingComments: true});
    config.buildFromProjectDir(path.join(__dirname, '../../resources/save'));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    let arkfile = scene.getFiles().find((value) => {
        return value.getName().endsWith('control_flow.ts');
    });
    if (!arkfile) {
        return;
    }

    it('case1', () => {
        let ns = arkfile!.getNamespaceWithName('Case1');
        let printer = new SourceNamespacePrinter(ns!);
        let dot = new PrinterBuilder('output');
        dot.dumpToDot(arkfile!);

        let source = printer.dump();
        if (source !== CASE1_EXPECT) {
            console.log('unit test failed: SourceControlFlowTest case1');
        }
    });

    it('case2', () => {
      let ns = arkfile!.getNamespaceWithName('Case2');
      let printer = new SourceNamespacePrinter(ns!);
      let dot = new PrinterBuilder('output');
      dot.dumpToDot(arkfile!);

      let source = printer.dump();
      expect(source).eq(CASE2_EXPECT);
  });
});