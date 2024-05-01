import * as fs from 'fs';
import { ArkClass } from "../core/model/ArkClass";

class ClassTransformer {

    public genClasses(classes: ArkClass[]) {
        for (let arkClass of classes) {
            if (arkClass.getName() != "_DEFAULT_ARK_CLASS") {
                // 去除默认类
                let classInfo = this.genClassInfo(arkClass)
                this.genClassFile(arkClass, classInfo)
            }
        }
    }

    private genClassFile(arkClass: ArkClass, content: string) {
        let className = arkClass.getName()
        let directory = "tests/resources/classTransformer/sendableOutput/"
        // TODO: 创建文件位置修改
        fs.mkdir(directory, { recursive: true }, (err) => {
            if (err) {
                console.error('Error creating directory:', err);
                return;
            }

            fs.writeFile(`${directory}${className}Creator.ts`, content, err => {
                // TODO: 接入日志
                console.log(`file ${className}.ts has been created successfully!`);
            });
        })
    }

    private genClassInfo(arkClass: ArkClass): string {
        let className: string = arkClass.getName()
        let fieldInializeContent = "\n", importInializeContent = ""
        for (let field of arkClass.getFields()) {
            if (field.getAtTypeDecorator() != "") {
                // TODO: 筛选带有Type注解的属性，目前仅设置单属性
                fieldInializeContent += `\t\tans.${field.getName()} = ${field.getAtTypeDecorator()}CreatorVar.create()\n`
                importInializeContent += `import { ${field.getAtTypeDecorator()}CreatorVar } from "./${field.getAtTypeDecorator()}Creator.ts"\n`
            }
        }
        const content = `${importInializeContent}
export class ${className}Creator {
    create(): ${className} {
        let ans: ${className} = new ${className}();
        ${fieldInializeContent}
        return ans;
    }
}

let ${className}CreatorVar = new ${className}Creator()
export { ${className}CreatorVar };`;

        return content
    }
}

export default new ClassTransformer();
