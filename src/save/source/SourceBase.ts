import { Decorator } from "../../core/base/Decorator";
import { ArkFile } from "../../core/model/ArkFile";
import { ArkCodeBuffer } from "../ArkStream";


export abstract class SourceBase {
    protected printer: ArkCodeBuffer;
    protected arkFile: ArkFile;

    public constructor(indent: string, arkFile: ArkFile) {
        this.printer = new ArkCodeBuffer(indent);
        this.arkFile = arkFile;
    }

    public abstract dump(): string;
    public abstract dumpOriginalCode(): string;
    public abstract getLine(): number;

    protected modifiersToString(modifiers: Set<string | Decorator>): string {
        let modifiersStr: string[] = [];
        modifiers.forEach((value) => {
            if (value instanceof Decorator) {
                // TODO
            } else {
                modifiersStr.push(this.resolveKeywordType(value))
            }
        });
    
        return modifiersStr.join(' ');
    }
    
    protected resolveKeywordType(keywordStr: string): string {
        // 'NumberKeyword | NullKeyword |
        let types: string[] = [];
        for (let keyword of keywordStr.split('|')) {
            keyword = keyword.trim();
            if (keyword.length == 0) {
                continue;
            }
            if (keyword.endsWith('Keyword')) {
                keyword = keyword.substring(0, keyword.length - 'Keyword'.length).toLowerCase();
            }
            types.push(keyword);
        }
        
        return types.join('|');
    }
    
    protected resolveMethodName(name: string): string {
        if (name === '_Constructor') {
            return 'constructor';
        }
        if (name.startsWith('Get-')) {
            return name.replace('Get-', 'get ');
        }
        if (name.startsWith('Set-')) {
            return name.replace('Set-', 'set ');
        }
        return name;
    }   
}

