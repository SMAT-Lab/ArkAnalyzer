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
# Mirror the current mainline branch from GitCode to GitHub as branch "mirror".
# Create the GitHub repository first; override GITHUB_REPO via argument or edit DEFAULT_GITHUB_REPO.
#
# Usage: ./script/mirror-to-github.sh [github_repo_url]
# Example: ./script/mirror-to-github.sh
# Example: ./script/mirror-to-github.sh git@github.com:SMAT-Lab/ArkAnalyzer.git
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
DEFAULT_GITHUB_REPO="git@github.com:SMAT-Lab/ArkAnalyzer.git"
GITHUB_REPO="${1:-$DEFAULT_GITHUB_REPO}"

cd "$REPO_DIR"

# Ensure remote "github" exists and points at GITHUB_REPO
if git remote | grep -q '^github$'; then
  git remote set-url github "$GITHUB_REPO"
else
  git remote add github "$GITHUB_REPO"
fi

# Current branch (typically main or master)
MAIN_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "master")

# Fetch so --force-with-lease compares against the latest remote refs
git fetch github

echo "Mirroring $MAIN_BRANCH to GitHub (mirror branch) with force push..."

# Force push with lease (safer than bare --force)
git push --force-with-lease github "${MAIN_BRANCH}:mirror"

echo "Done. GitHub mirror branch updated."