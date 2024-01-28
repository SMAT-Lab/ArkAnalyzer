export function isPrimaryType(type: string): boolean {
    switch (type) {
        case "boolean":
        case "number":
        case "string":
        case "void":
        case "any":
            return true
        default:
            return false
    }
}