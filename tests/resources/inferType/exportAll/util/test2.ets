export interface TestInterface {
    callf(s: string): string;
}

abstract class InterfaceImpl implements TestInterface {
    callf(s: string): string {
        return '';
    }

    implfunc(): void {
        console.log('aaa')
    }

    abstract func2(): void;
}

export class Ineterface2 extends InterfaceImpl {
    func2(): void {
        console.log('ccc');
    }
}

export function genericFunction<T extends TestInterface = InterfaceImpl>(a: T) {
    a.callf('aaa');
}

export const N = 32;

export * from './test2';