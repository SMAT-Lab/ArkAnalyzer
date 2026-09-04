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

/**
 * Build stages of a {@link Scene}. Extracted from Scene.ts so the frontend layer can
 * value-import it without pulling in the whole Scene module (avoids Scene ↔ frontend
 * import cycles during the build-machinery migration into frontend).
 *
 * Scene.ts re-exports this enum for backward compatibility.
 */
export enum SceneBuildStage {
    BUILD_INIT,
    SDK_INFERRED,
    CLASS_DONE,
    METHOD_DONE,
    TYPE_INFERRED,
}
