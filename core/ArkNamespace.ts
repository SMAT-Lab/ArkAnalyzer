import { ArkClass } from "./ArkClass";

// Namespace可以在多个文件中实现
export class ArkNamespace {
    name: string;

    classes: ArkClass[] = [];

    constructor(name: string) {
        this.name = name;
    }
}