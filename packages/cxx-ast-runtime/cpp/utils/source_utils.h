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
#pragma once

#include <string>

#include "clang/Basic/SourceLocation.h"
#include "clang/Basic/SourceManager.h"
#include "clang/Basic/LangOptions.h"

namespace ast_dumper {

// main-file check (macro expansion included)
bool IsFromMainFileIncludingExpansion(const clang::SourceManager &sm, clang::SourceLocation loc);

// extract source text for a range (default: expansion range)
std::string GetSourceTextByRange(const clang::SourceManager &sm,
                                 const clang::LangOptions &lo,
                                 clang::SourceRange sr,
                                 bool useExpansionRange = true);

} // namespace ast_dumper
