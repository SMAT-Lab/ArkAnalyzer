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

#pragma once

#include <string>

#include "llvm/ADT/StringRef.h"

namespace ast_dumper {

constexpr unsigned SMALL_PATH_BUFFER_SIZE = 256;
constexpr unsigned FLAT_OUT_PATH_BUFFER_SIZE = SMALL_PATH_BUFFER_SIZE * 2;
constexpr unsigned FLAT_OUT_STEM_BUFFER_SIZE = SMALL_PATH_BUFFER_SIZE;
constexpr unsigned PATH_PARENT_BUFFER_SIZE = SMALL_PATH_BUFFER_SIZE;
constexpr size_t FLAT_OUT_MAX_STEM_LEN = 200;

/** Slug basename derived from absolute source path (unique per TU). */
std::string FlatOutBasename(llvm::StringRef sourceFile);

/** Absolute path: flatOutputDir + slug + ".ast.flat". */
std::string ComputeFlatOutPath(llvm::StringRef sourceFile, llvm::StringRef flatOutputDir);

} // namespace ast_dumper
