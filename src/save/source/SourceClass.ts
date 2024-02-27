import { ArkClass } from "../../core/model/ArkClass";
import { SourceBase } from "./SourceBase";


export class SourceClass extends SourceBase{
    cls: ArkClass;

    public constructor(indent: string, cls: ArkClass) {
        super(indent);
        this.cls = cls;
    }

    public dump(): string {
        // print export class name<> + extends c0 implements x1, x2 {
        this.printer.writeIndent().writeSpace(this.modifiersToString(this.cls.getModifiers()))
            .write(`class ${this.cls.getName()}`);
        if (this.cls.getTypeParameter().length > 0) {
            this.printer.write(`<${this.cls.getTypeParameter().join(',')}>`);
        }
        if (this.cls.getSuperClassName()) {
            this.printer.write(` extends ${this.cls.getSuperClassName()} `);
        }
        if (this.cls.getImplementedInterfaceNames().length > 0) {
            this.printer.write(` implements ${this.cls.getImplementedInterfaceNames().join(',')}`);
        }
        this.printer.writeLine('{');
        this.printer.incIndent();

        this.printFields();
        this.printMethods();
        
        this.printer.decIndent();
        this.printer.writeIndent().writeLine('}');
        return this.printer.toString();
    }

    public dumpOriginalCode(): string {
        return this.cls.getCode();
    }

    protected printMethods(): void {
        for (let method of this.cls.getMethods()) {
            if (method.isDefaultArkMethod()) {
                this.printBody(method.getBody(), true);
            } else {
                this.printMethod(method);
            }
        }
    }

    private printFields(): void {
        for (let property of this.cls.getProperties()) {
            this.printer.writeIndent()
                .writeSpace(this.modifiersToString(property.getModifiers()))
                .write(property.getPropertyName());

            // property.getInitializer() PropertyAccessExpression ArrowFunction ClassExpression FirstLiteralToken StringLiteral 
            // TODO: Initializer not ready
            if (property.getType().length > 0) {
                this.printer.write(':' + this.resolveKeywordType(property.getType()));
            }
            if (property.getInitializer() == 'ClassExpression') {
                this.printer.writeLine(' = class {');
                this.printer.writeIndent().writeLine('}');
            } else if (property.getInitializer() == 'ArrowFunction') {
                this.printer.writeLine(' = ()=> {');
                this.printer.writeIndent().writeLine('}');
            } else {
                this.printer.writeLine(';');
            }
        }
    }
}

export class SourceDefaultClass extends SourceClass {
    public constructor(indent: string, cls: ArkClass) {
        super(indent, cls);
    }

    public dump(): string {
        this.printMethods();
        return this.printer.toString();
    }

    public dumpOriginalCode(): string {
        for (let method of this.cls.getMethods()) {
            if (method.isDefaultArkMethod()) {
                for (let stmt of method.getBody().getOriginalCfg().getStmts()) {
                    let code = stmt.toString();
                    if (!code.startsWith('import') && code !== 'return;') {
                        this.printer.writeLine(code);
                    }
                }
            } else {
                this.printer.writeLine(method.getCode());
            }
        }
        return this.printer.toString();
    }
}