/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

// 对象字面量赋值给 SDK 声明类型：回归 SDK 类字段 initializer 写穿的场景。
// 声明侧 media.AVMetadata 是 SDK 接口（album?: string; albumArtist?: string; ...;
// hdrType?: HdrType——接口字段类型为枚举，复刻 audio.AudioRendererInfo.usage 场景）。

import media from '@ohos.multimedia.media';

function makeMetadata(): media.AVMetadata {
    let meta: media.AVMetadata = {
        album: 'album-value',
        albumArtist: 'artist-value',
        hdrType: media.HdrType.AV_HDR_TYPE_NONE,
    };
    return meta;
}

function main() {
    let m = makeMetadata();
    return m.album;
}
