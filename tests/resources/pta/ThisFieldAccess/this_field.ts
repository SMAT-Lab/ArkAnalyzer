/**
 * 测试 this 字段访问的处理
 * 验证 PagThisRefNode 作为 baseNode 时的字段访问是否正确
 */

namespace ThisFieldAccessTest {
    export class MyClass {
        public name: string = "test";
        public value: number = 0;
        
        public method1(): void {
            // 直接访问 this 字段
            // @pta-expect: field-access(this.name) handled
            const n = this.name;
            
            // @pta-expect: field-access(this.value) handled
            this.value = 42;
        }
        
        public method2(): void {
            // 在不同的方法中访问 this 字段
            // @pta-expect: field-access(this.name) handled
            const n = this.name;
        }
    }
    
    export function test(): void {
        const obj = new MyClass();
        obj.method1();
        obj.method2();
    }
}

