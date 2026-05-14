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

import { describe, expect, it } from 'vitest';
import { BaseModelTag, CLASS_SPECIFIC_TAG_SHIFT } from '../../../../src/core/model/ArkBaseModel';
import { ArkMethod } from '../../../../src/core/model/ArkMethod';
import { ArkField, FieldCategory, FIELD_CATEGORY_SHIFT, FIELD_CATEGORY_MASK } from '../../../../src/core/model/ArkField';
import { ArkClass, ClassCategory, CLASS_CATEGORY_SHIFT, CLASS_CATEGORY_MASK } from '../../../../src/core/model/ArkClass';
import { ImportInfo, ImportType, IMPORT_TYPE_SHIFT, IMPORT_TYPE_MASK } from '../../../../src/core/model/ArkImport';
import { ExportInfo, ExportType, EXPORT_TYPE_SHIFT, EXPORT_TYPE_MASK } from '../../../../src/core/model/ArkExport';

describe('BaseModelTag Shared Properties Test', () => {
    it('test GENERATED tag in ArkMethod', () => {
        const method = new ArkMethod();
        expect(method.isGenerated()).toBe(false);
        
        method.setIsGeneratedFlag(true);
        expect(method.isGenerated()).toBe(true);
        expect(method.containsTag(BaseModelTag.GENERATED)).toBe(true);
        
        method.setIsGeneratedFlag(false);
        expect(method.isGenerated()).toBe(false);
        expect(method.containsTag(BaseModelTag.GENERATED)).toBe(false);
    });

    it('test ASTERISK_TOKEN tag in ArkMethod', () => {
        const method = new ArkMethod();
        expect(method.getAsteriskToken()).toBe(false);
        
        method.setAsteriskToken(true);
        expect(method.getAsteriskToken()).toBe(true);
        expect(method.containsTag(BaseModelTag.ASTERISK_TOKEN)).toBe(true);
        
        method.setAsteriskToken(false);
        expect(method.getAsteriskToken()).toBe(false);
        expect(method.containsTag(BaseModelTag.ASTERISK_TOKEN)).toBe(false);
    });

    it('test QUESTION_TOKEN tag in ArkMethod', () => {
        const method = new ArkMethod();
        expect(method.getQuestionToken()).toBe(false);
        
        method.setQuestionToken(true);
        expect(method.getQuestionToken()).toBe(true);
        expect(method.containsTag(BaseModelTag.QUESTION_TOKEN)).toBe(true);
        
        method.setQuestionToken(false);
        expect(method.getQuestionToken()).toBe(false);
        expect(method.containsTag(BaseModelTag.QUESTION_TOKEN)).toBe(false);
    });

    it('test QUESTION_TOKEN tag in ArkField (shared semantic)', () => {
        const field = new ArkField();
        expect(field.getQuestionToken()).toBe(false);
        
        field.setQuestionToken(true);
        expect(field.getQuestionToken()).toBe(true);
        expect(field.containsTag(BaseModelTag.QUESTION_TOKEN)).toBe(true);
        
        field.setQuestionToken(false);
        expect(field.getQuestionToken()).toBe(false);
        expect(field.containsTag(BaseModelTag.QUESTION_TOKEN)).toBe(false);
    });

    it('test EXCLAMATION_TOKEN tag in ArkField', () => {
        const field = new ArkField();
        expect(field.getExclamationToken()).toBe(false);
        
        field.setExclamationToken(true);
        expect(field.getExclamationToken()).toBe(true);
        expect(field.containsTag(BaseModelTag.EXCLAMATION_TOKEN)).toBe(true);
        
        field.setExclamationToken(false);
        expect(field.getExclamationToken()).toBe(false);
        expect(field.containsTag(BaseModelTag.EXCLAMATION_TOKEN)).toBe(false);
    });

    it('test multiple tags can be set simultaneously', () => {
        const method = new ArkMethod();
        method.setIsGeneratedFlag(true);
        method.setAsteriskToken(true);
        method.setQuestionToken(true);
        
        expect(method.isGenerated()).toBe(true);
        expect(method.getAsteriskToken()).toBe(true);
        expect(method.getQuestionToken()).toBe(true);
        
        const tags = method.getTags();
        expect(tags).toBe(BaseModelTag.GENERATED | BaseModelTag.ASTERISK_TOKEN | BaseModelTag.QUESTION_TOKEN);
    });

    it('test tags bit positions are correct', () => {
        expect(BaseModelTag.GENERATED).toBe(1);
        expect(BaseModelTag.ASTERISK_TOKEN).toBe(1 << 1);
        expect(BaseModelTag.QUESTION_TOKEN).toBe(1 << 2);
        expect(BaseModelTag.EXCLAMATION_TOKEN).toBe(1 << 3);
    });
});

describe('ImportType Class-Specific Encoding Test', () => {
    it('test IMPORT_TYPE_SHIFT and MASK values', () => {
        expect(IMPORT_TYPE_SHIFT).toBe(CLASS_SPECIFIC_TAG_SHIFT);
        expect(IMPORT_TYPE_MASK).toBe(0x7 << CLASS_SPECIFIC_TAG_SHIFT);
    });

    it('test ImportType enum uses value encoding', () => {
        expect(ImportType.NONE_IMPORT).toBe(0);
        expect(ImportType.IDENTIFIER_IMPORT).toBe(1);
        expect(ImportType.NAMED_IMPORTS_IMPORT).toBe(2);
        expect(ImportType.NAMESPACE_IMPORT).toBe(3);
        expect(ImportType.EQUALS_IMPORT).toBe(4);
        expect(ImportType.TYPE_ALIAS_IMPORT).toBe(5);
    });

    it('test NONE_IMPORT for side-effect imports', () => {
        const importInfo = new ImportInfo();
        importInfo.setImportTypeTag(ImportType.NONE_IMPORT);
        expect(importInfo.getImportTypeTag()).toBe(0);
        expect(importInfo.getImportType()).toBe('');
    });

    it('test setImportTypeTag and getImportTypeTag', () => {
        const importInfo = new ImportInfo();
        expect(importInfo.getImportTypeTag()).toBe(0);
        
        importInfo.setImportTypeTag(ImportType.IDENTIFIER_IMPORT);
        expect(importInfo.getImportTypeTag()).toBe(ImportType.IDENTIFIER_IMPORT);
        
        importInfo.setImportTypeTag(ImportType.NAMESPACE_IMPORT);
        expect(importInfo.getImportTypeTag()).toBe(ImportType.NAMESPACE_IMPORT);
    });

    it('test deprecated getImportType and setImportType', () => {
        const importInfo = new ImportInfo();
        expect(importInfo.getImportType()).toBe('');
        
        importInfo.setImportType('Identifier');
        expect(importInfo.getImportType()).toBe('Identifier');
        expect(importInfo.getImportTypeTag()).toBe(ImportType.IDENTIFIER_IMPORT);
        
        importInfo.setImportType('NamedImports');
        expect(importInfo.getImportType()).toBe('NamedImports');
        expect(importInfo.getImportTypeTag()).toBe(ImportType.NAMED_IMPORTS_IMPORT);
        
        importInfo.setImportType('NamespaceImport');
        expect(importInfo.getImportType()).toBe('NamespaceImport');
        expect(importInfo.getImportTypeTag()).toBe(ImportType.NAMESPACE_IMPORT);
        
        importInfo.setImportType('EqualsImport');
        expect(importInfo.getImportType()).toBe('EqualsImport');
        expect(importInfo.getImportTypeTag()).toBe(ImportType.EQUALS_IMPORT);
        
        importInfo.setImportType('TypeAlias');
        expect(importInfo.getImportType()).toBe('TypeAlias');
        expect(importInfo.getImportTypeTag()).toBe(ImportType.TYPE_ALIAS_IMPORT);
        
        importInfo.setImportType('');
        expect(importInfo.getImportType()).toBe('');
        expect(importInfo.getImportTypeTag()).toBe(ImportType.NONE_IMPORT);
    });
});

describe('FieldCategory Class-Specific Encoding Test', () => {
    it('test FIELD_CATEGORY_SHIFT and MASK values', () => {
        expect(FIELD_CATEGORY_SHIFT).toBe(CLASS_SPECIFIC_TAG_SHIFT);
        expect(FIELD_CATEGORY_MASK).toBe(0xF << CLASS_SPECIFIC_TAG_SHIFT);
    });

    it('test setCategory and getCategory', () => {
        const field = new ArkField();
        
        field.setCategory(FieldCategory.PROPERTY_DECLARATION);
        expect(field.getCategory()).toBe(FieldCategory.PROPERTY_DECLARATION);
        
        field.setCategory(FieldCategory.ENUM_MEMBER);
        expect(field.getCategory()).toBe(FieldCategory.ENUM_MEMBER);
        
        field.setCategory(FieldCategory.GET_ACCESSOR);
        expect(field.getCategory()).toBe(FieldCategory.GET_ACCESSOR);
    });

    it('test FieldCategory does not conflict with shared tags', () => {
        const field = new ArkField();
        field.setQuestionToken(true);
        field.setExclamationToken(true);
        field.setCategory(FieldCategory.ENUM_MEMBER);
        
        expect(field.getQuestionToken()).toBe(true);
        expect(field.getExclamationToken()).toBe(true);
        expect(field.getCategory()).toBe(FieldCategory.ENUM_MEMBER);
    });
});

describe('ClassCategory Class-Specific Encoding Test', () => {
    it('test CLASS_CATEGORY_SHIFT and MASK values', () => {
        expect(CLASS_CATEGORY_SHIFT).toBe(CLASS_SPECIFIC_TAG_SHIFT);
        expect(CLASS_CATEGORY_MASK).toBe(0x7 << CLASS_SPECIFIC_TAG_SHIFT);
    });

    it('test setCategory and getCategory', () => {
        const arkClass = new ArkClass();
        
        arkClass.setCategory(ClassCategory.CLASS);
        expect(arkClass.getCategory()).toBe(ClassCategory.CLASS);
        
        arkClass.setCategory(ClassCategory.INTERFACE);
        expect(arkClass.getCategory()).toBe(ClassCategory.INTERFACE);
        
        arkClass.setCategory(ClassCategory.ENUM);
        expect(arkClass.getCategory()).toBe(ClassCategory.ENUM);
        
        arkClass.setCategory(ClassCategory.STRUCT);
        expect(arkClass.getCategory()).toBe(ClassCategory.STRUCT);
    });

    it('test default category is CLASS', () => {
        const arkClass = new ArkClass();
        expect(arkClass.getCategory()).toBe(ClassCategory.CLASS);
    });
});

describe('ExportType Class-Specific Encoding Test', () => {
    it('test EXPORT_TYPE_SHIFT and MASK values', () => {
        expect(EXPORT_TYPE_SHIFT).toBe(CLASS_SPECIFIC_TAG_SHIFT);
        expect(EXPORT_TYPE_MASK).toBe(0xF << CLASS_SPECIFIC_TAG_SHIFT);
    });

    it('test setExportClauseType and getExportClauseType', () => {
        const exportInfo = new ExportInfo.Builder().build();
        exportInfo.setExportClauseType(ExportType.NAME_SPACE);
        expect(exportInfo.getExportClauseType()).toBe(ExportType.NAME_SPACE);
        
        exportInfo.setExportClauseType(ExportType.CLASS);
        expect(exportInfo.getExportClauseType()).toBe(ExportType.CLASS);
        
        exportInfo.setExportClauseType(ExportType.METHOD);
        expect(exportInfo.getExportClauseType()).toBe(ExportType.METHOD);
        
        exportInfo.setExportClauseType(ExportType.TYPE);
        expect(exportInfo.getExportClauseType()).toBe(ExportType.TYPE);
    });

    it('test UNKNOWN export type (value 9) can be set and retrieved correctly', () => {
        const exportInfo = new ExportInfo.Builder().build();
        exportInfo.setExportClauseType(ExportType.UNKNOWN);
        expect(exportInfo.getExportClauseType()).toBe(ExportType.UNKNOWN);
    });
});

describe('Tags Basic Operations Test', () => {
    it('test getTags returns 0 when undefined', () => {
        const method = new ArkMethod();
        expect(method.getTags()).toBe(0);
    });

    it('test addTag and removeTag', () => {
        const method = new ArkMethod();
        method.addTag(BaseModelTag.GENERATED);
        expect(method.getTags()).toBe(BaseModelTag.GENERATED);
        
        method.addTag(BaseModelTag.ASTERISK_TOKEN);
        expect(method.getTags()).toBe(BaseModelTag.GENERATED | BaseModelTag.ASTERISK_TOKEN);
        
        method.removeTag(BaseModelTag.GENERATED);
        expect(method.getTags()).toBe(BaseModelTag.ASTERISK_TOKEN);
    });

    it('test containsTag', () => {
        const method = new ArkMethod();
        method.addTag(BaseModelTag.GENERATED | BaseModelTag.ASTERISK_TOKEN);
        
        expect(method.containsTag(BaseModelTag.GENERATED)).toBe(true);
        expect(method.containsTag(BaseModelTag.ASTERISK_TOKEN)).toBe(true);
        expect(method.containsTag(BaseModelTag.QUESTION_TOKEN)).toBe(false);
    });

    it('test setTags and getTags', () => {
        const method = new ArkMethod();
        method.setTags(BaseModelTag.GENERATED | BaseModelTag.ASTERISK_TOKEN);
        expect(method.getTags()).toBe(BaseModelTag.GENERATED | BaseModelTag.ASTERISK_TOKEN);
        
        method.setTags(0);
        expect(method.getTags()).toBe(0);
    });

    it('test setTags(0) clears existing tags', () => {
        const method = new ArkMethod();
        method.addTag(BaseModelTag.GENERATED);
        method.addTag(BaseModelTag.ASTERISK_TOKEN);
        expect(method.getTags()).toBe(BaseModelTag.GENERATED | BaseModelTag.ASTERISK_TOKEN);
        
        method.setTags(0);
        expect(method.getTags()).toBe(0);
        expect(method.isGenerated()).toBe(false);
        expect(method.getAsteriskToken()).toBe(false);
    });
});

describe('Bit Range Separation Test', () => {
    it('test shared area (Bit 0-15) does not conflict with class-specific area (Bit 16+)', () => {
        const field = new ArkField();
        
        field.setQuestionToken(true);
        field.setExclamationToken(true);
        field.setCategory(FieldCategory.ENUM_MEMBER);
        
        const tags = field.getTags();
        
        const sharedArea = tags & 0xFFFF;
        expect(sharedArea).toBe(BaseModelTag.QUESTION_TOKEN | BaseModelTag.EXCLAMATION_TOKEN);
        
        const classSpecificArea = (tags & FIELD_CATEGORY_MASK) >>> FIELD_CATEGORY_SHIFT;
        expect(classSpecificArea).toBe(FieldCategory.ENUM_MEMBER);
    });

    it('test ImportType uses value encoding (not bitmask)', () => {
        const importInfo = new ImportInfo();
        
        importInfo.setImportTypeTag(ImportType.IDENTIFIER_IMPORT);
        const tags = importInfo.getTags();
        const sharedArea = tags & 0xFFFF;
        expect(sharedArea).toBe(0);
        
        const encodedValue = (tags & IMPORT_TYPE_MASK) >>> IMPORT_TYPE_SHIFT;
        expect(encodedValue).toBe(ImportType.IDENTIFIER_IMPORT);
        expect(encodedValue).toBe(1);
    });

    it('test ImportType encoding stores value in bits 16-18', () => {
        const importInfo = new ImportInfo();
        
        importInfo.setImportTypeTag(ImportType.TYPE_ALIAS_IMPORT);
        const encodedValue = (importInfo.getTags() & IMPORT_TYPE_MASK) >>> IMPORT_TYPE_SHIFT;
        expect(encodedValue).toBe(ImportType.TYPE_ALIAS_IMPORT);
        expect(encodedValue).toBe(5);
    });
});