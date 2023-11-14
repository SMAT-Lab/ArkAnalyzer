
//一个文件（Module）默认当做一个类(类名称为M_FileName)
class ArkClass {
    isModule: boolean = false;
    isExported: boolean = false;

    name: string;

    superClass: ArkClass | null;
    implementedInterfaces: ArkClass[] = [];

    fields: ArkField[] = [];
    functions: ArkClass[] = [];

    constructor(name: string) {
        this.name = name;

        this.superClass = null;
    }
}