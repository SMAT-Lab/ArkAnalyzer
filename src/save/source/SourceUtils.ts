import { ArrayType, ClassType, LiteralType, Type, TypeLiteralType, UnknownType } from "../../core/base/Type";

export class SourceUtils {
    public static typeToString(type: Type): string {
        if (type instanceof TypeLiteralType) {
            let typesStr: string[] = [];
            for (const member of type.getMembers()) {
                typesStr.push(member.getName() + ':' + member.getType());
            }
            return `{${typesStr.join(',')}}`;
        } else if (type instanceof Array) {
            let typesStr: string[] = [];
            for (const member of type) {
                typesStr.push(this.typeToString(member));
            }
            return typesStr.join(' | ');
        } else if (type instanceof LiteralType) {
            let literalName = type.getliteralName() as string;            
            return literalName.substring(0, literalName.length - 'Keyword'.length).toLowerCase();
        } else if (type instanceof UnknownType) {
            return 'any';
        } else if (type instanceof ClassType) {
            return type.getClassSignature().getClassName();
        } else if (type instanceof ArrayType) {
            if (type.getBaseType() instanceof UnknownType) {
                const strs: string[] = [];
                strs.push('(any)');
                for (let i = 0; i < type.getDimension(); i++) {
                    strs.push('[]');
                }
                return strs.join('');
            } else {
                return type.toString();
            }
        } else {
            return type.toString();
        }
    }

    public static typeArrayToString(types: Type[], split: string=','): string {
        let typesStr: string[] = [];
        types.forEach((t) => {
            typesStr.push(SourceUtils.typeToString(t));
        });

        return typesStr.join(split);
    }
    
}