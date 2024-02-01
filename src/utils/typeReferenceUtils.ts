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

export function splitType(typeName: string): string[] {
    return typeName.split('|')
}

export function transformArrayToString<T>(array: T[], separator: string = '|'): string {
    return array.join(separator);
}