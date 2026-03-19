#!/bin/bash
#
# Copyright (c) 2024-2026 Huawei Device Co., Ltd.
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# 将 GitCode 的 main/master 分支镜像到 GitHub，并创建 mirror 分支
# 使用前请先在 GitHub 创建仓库，并替换下方 GITHUB_REPO 为实际地址
#
# 用法: ./script/mirror-to-github.sh [github_repo_url]
# 示例: ./script/mirror-to-github.sh
# 示例: ./script/mirror-to-github.sh git@github.com:SMAT-Lab/ArkAnalyzer.git
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
DEFAULT_GITHUB_REPO="git@github.com:SMAT-Lab/ArkAnalyzer.git"
GITHUB_REPO="${1:-$DEFAULT_GITHUB_REPO}"

cd "$REPO_DIR"

# 检查是否已有 github 远程
if git remote | grep -q '^github$'; then
  git remote set-url github "$GITHUB_REPO"
else
  git remote add github "$GITHUB_REPO"
fi

# 获取当前主分支（master 或 main）
MAIN_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "master")

echo "Mirroring $MAIN_BRANCH to GitHub (mirror branch)..."

# 推送主分支到 GitHub 的 mirror 分支
git push github "${MAIN_BRANCH}:mirror"

echo "Done. GitHub mirror branch updated."
