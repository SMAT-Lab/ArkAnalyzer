import { ArkClass } from "../../core/model/ArkClass";
import { ArkFile } from "../../core/model/ArkFile";
import { SourceBase } from "./SourceBase";
import { SourceMethod } from "./SourceMethod";


export class SourceClass extends SourceBase{
    cls: ArkClass;

    public constructor(indent: string, arkFile: ArkFile, cls: ArkClass) {
        super(indent, arkFile);
        this.cls = cls;
    }

    public getLine(): number {
        return this.cls.getLine();
    }

    public dump(): string {
        // print export class name<> + extends c0 implements x1, x2 {
        this.printer.writeIndent().writeSpace(this.modifiersToString(this.cls.getModifiers()))
            .write(`${this.cls.getOriginType()} ${this.cls.getName()}`);
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
        return this.cls.getCode() + '\n';
    }

    protected printMethods(): void {
        let items: SourceBase[] = [];
        for (let method of this.cls.getMethods()) {
            items.push(new SourceMethod(this.printer.getIndent(), this.arkFile, method));
        }
        items.sort((a, b) => a.getLine() - b.getLine());
        items.forEach((v):void => {
            this.printer.write(v.dump());
        });
    }

    private printFields(): void {
        for (let field of this.cls.getFields()) {
            this.printer.writeIndent()
                .writeSpace(this.modifiersToString(field.getModifiers()))
                .write(field.getName());

            // property.getInitializer() PropertyAccessExpression ArrowFunction ClassExpression FirstLiteralToken StringLiteral 
            // TODO: Initializer not ready
            if (field.getType()) {
                this.printer.write(':' + field.getType());
            }
            this.printer.writeLine(';');
        }
    }
}

export class SourceDefaultClass extends SourceClass {
    public constructor(indent: string, arkFile: ArkFile, cls: ArkClass) {
        super(indent, arkFile, cls);
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