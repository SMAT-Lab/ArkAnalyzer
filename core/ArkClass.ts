import { ArkField } from "./ArkField";
import { ArkMethod } from "./ArkMethod";

//一个文件（Module）默认当做一个类(类名称为M_FileName)
export class ArkClass {
    isModule: boolean = false;
    isExported: boolean = false;

    name: string;

    superClass: ArkClass | null;
    implementedInterfaces: ArkClass[] = [];

    fields: ArkField[] = [];
    methods: ArkMethod[] = [];

    constructor(name: string) {
        this.name = name;

        this.superClass = null;
    }

    public getMethods(): ArkMethod[] {
        return []
    }
}