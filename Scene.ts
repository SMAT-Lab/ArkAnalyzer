import { ArkClass } from "./core/ArkClass";
import { ArkNamespace } from "./core/ArkNamespace";

/**
 * The Scene class includes everything in the analyzed project.
 * We should be able to re-generate the project's code based on this class.
 */
export class Scene {
    namespaces: ArkNamespace[] = [];
    classes: ArkClass[] = [];

    public getApplicationClasses(): ArkClass[] {
        return [];
    }
}