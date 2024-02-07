/*
 * TODO:
 * 1. Local:
 *  a) type 识别
 *      let sam: <classes.ts>.<Snake>;  
 *      let tom: classes.ts.Animal|<classes.ts>.<Horse>;
 *  b) console 等全局函数被定义为local，如何区分？
 * 2. Method parameter:
 *  a) default value
 *      source: move(distanceInMeters = 5)  parsed: move(distanceInMeters: )
 *  b) map type
 *      source: calculateDistanceFromOrigin(point: {x: number; y: number;})   parsed: calculateDistanceFromOrigin(point: TypeLiteral)
 * 3. Fileld:
 *  a) default value
 *      source: readonly numberOfLegs: number = 8; parsed: readonly numberOfLegs:number;
 * 4. Stmt
 *  a) string
 *      source: console.log('Department name: ' + this.name);
 *      parsed: temp2 = ''Department name: '' + temp1;
 *              console.log(temp2);
 *  b) in 解析结果与of相同，与实际语法不同
 *  c) of 不支持Set()
 *   
 * 5. Enum
 *  a) 初始化不支持 
 *      source: No = 0,
 *      parsed: No,
 * 6. namespace
 *  a) 不支持Field定义
 *      namespace Validation {
 *          const lettersRegexp = /^[A-Za-z]+$/;
 *      }
 *  b) 不支持function定义
 *      namespace Validation {
 *          function test(): void {
 *              console.log('');
 *          }
 *      }
 */
import { ArkStream } from '../ArkStream';
import { Printer } from '../Printer';
import { SourceBase } from './SourceBase';
import { SourceClass, SourceDefaultClass } from './SourceClass';
import { SourceEnum } from './SourceEnum';
import { SourceIntf } from './SourceIntf';
import { SourceExportInfo, SourceImportInfo } from './SourceModule';
import { SourceNamespace } from './SourceNamespace';

export class SourcePrinter extends Printer {
    items: SourceBase[] = [];

    public printTo(streamOut: ArkStream): void {
        // print imports
        for (let info of this.arkFile.getImportInfos()) {
            this.items.push(new SourceImportInfo('', this.arkFile.getScene(), info));
        }
        // print namespace
        for (let ns of this.arkFile.getNamespaces()) {
            this.items.push(new SourceNamespace('', this.arkFile.getScene(), ns));
        }

        // print enums
        for (let eNum of this.arkFile.getEnums()) {
            this.items.push(new SourceEnum('', this.arkFile.getScene(), eNum));
        }

        // print interface
        for (let intf of this.arkFile.getInterfaces()) {
            this.items.push(new SourceIntf('', this.arkFile.getScene(), intf));
        }
        
        // print class 
        for (let cls of this.arkFile.getClasses()) {
            if (cls.isDefaultArkClass()) {
                this.items.push(new SourceDefaultClass('', this.arkFile.getScene(), cls));
            } else {
                this.items.push(new SourceClass('', this.arkFile.getScene(), cls));
            }
        }
        // print export
        for (let info of this.arkFile.getExportInfos()) {
            this.items.push(new SourceExportInfo('', this.arkFile.getScene(), info));
        }

        this.items.sort();
        this.items.sort();
        this.items.forEach((v):void => {
            streamOut.write(v.dump());
        });
    }

    public printOriginalCode(streamOut: ArkStream): void {
        streamOut.write(this.arkFile.getCode());
    }
}