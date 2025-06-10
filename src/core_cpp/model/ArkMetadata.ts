/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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

import { FullPosition } from '../base/Position';

export enum ArkMetadataKind {
    LEADING_COMMENTS,
    TRAILING_COMMENTS,
}

export interface ArkMetadataType {}

/**
 * ArkMetadata
 * @example
 * // get leading comments
 * let stmt: Stmt = xxx;
 * let comments = stmt.getMetadata(ArkMetadataKind.LEADING_COMMENTS) || [];
 * comments.forEach((comment) => {
 *   logger.info(comment);
 * });
 */
export class ArkMetadata {
    protected metadata?: Map<ArkMetadataKind, ArkMetadataType>;

    public getMetadata(kind: ArkMetadataKind): ArkMetadataType | undefined {
        return this.metadata?.get(kind);
    }

    public setMetadata(kind: ArkMetadataKind, value: ArkMetadataType): void {
        if (!this.metadata) {
            this.metadata = new Map();
        }
        this.metadata.set(kind, value);
    }
}

export type CommentItem = {
    content: string;
    position: FullPosition;
};

export class CommentsMetadata implements ArkMetadataType {
    private comments: CommentItem[] = [];

    constructor(comments: CommentItem[]) {
        this.comments = comments;
    }

    public getComments(): CommentItem[] {
        return this.comments;
    }
}
