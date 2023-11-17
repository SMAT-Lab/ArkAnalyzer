import { ArkField } from "./ArkField";
import { ArkMethod } from "./ArkMethod";

export class ArkClass {
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