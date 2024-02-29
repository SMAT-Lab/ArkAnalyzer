/*
 * TODO:
 * 
 * 1. Method parameter:
 *  a) default value 不支持
 *      source: move(distanceInMeters = 5)  
 *      parsed: move(distanceInMeters)
 *  c) string[] 类型解析为 ArrayType，无法还原
 *  d) 构造函数Access Modifiers 不支持
 *     constructor(public make: string, public model: string) {
 *     }
 * 
 * 2. Fileld:
 *  a) default value
 *      source: readonly numberOfLegs: number = 8; 
 *      parsed: readonly numberOfLegs:number;
 * 
 *   
 * 3. Enum
 *  a) 初始化不支持二元操作和函数调用
 *      enum FileAccess {
 *          // constant members
 *          None,
 *          Read    = 1 << 1,
 *          Write   = 1 << 2,
 *          ReadWrite  = Read | Write,
 *          // computed member
 *          G = "123".length
 *   }
 * 
 * 4. 泛型
 *  a) field泛型<>类型丢失
 * class GenericNumber<T> {
 *     private methods: Set<string>;
 *     private calls: Map<string, string[]>;
 * }
 */
import { ArkStream } from '../ArkStream';
import { Printer } from '../Printer';
import { SourceBase } from './SourceBase';
import { SourceClass} from './SourceClass';
import { SourceMethod } from './SourceMethod';
import { SourceExportInfo, SourceImportInfo } from './SourceModule';
import { SourceNamespace } from './SourceNamespace';

export class SourcePrinter extends Printer {
    items: SourceBase[] = [];

    public printTo(streamOut: ArkStream): void {
        // print imports
        for (let info of this.arkFile.getImportInfos()) {
            this.items.push(new SourceImportInfo('', this.arkFile, info));
        }
        // print namespace
        for (let ns of this.arkFile.getNamespaces()) {
            this.items.push(new SourceNamespace('', this.arkFile, ns));
        }
        
        // print class 
        for (let cls of this.arkFile.getClasses()) {
            if (cls.isDefaultArkClass()) {
                for (let method of cls.getMethods()) {
                    if (!method.getName().startsWith('AnonymousFunc$_')) {
                        this.items.push(new SourceMethod('', this.arkFile, method));
                    }
                }
            } else {
                this.items.push(new SourceClass('', this.arkFile, cls));
            }
        }
        // print export
        for (let info of this.arkFile.getExportInfos()) {
            this.items.push(new SourceExportInfo('', this.arkFile, info));
        }

        this.items.sort((a, b) => a.getLine() - b.getLine());
        this.items.forEach((v):void => {
            streamOut.write(v.dump());
        });
    }

    public printOriginalCode(streamOut: ArkStream): void {
        streamOut.write(this.arkFile.getCode());
    }
}