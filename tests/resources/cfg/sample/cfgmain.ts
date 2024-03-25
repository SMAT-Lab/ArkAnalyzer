import hilog from '@ohos.hilog';
import { Log } from "../moduleA/Log";

class Foo {
    public func1() {
        Bar.OnTouch((i: number) => {
            this.func2();
        })
    }

    private func2() {
        Log.showInfo();
    }

    public func3() {
        Bar.OnTouch((i: number) => {
            hilog.info();
        })
    }

    public func4() {
        Bar.OnTouch((i: number) => {
            this.func5();
        })
    }

    private func5() {
        hilog.info();
    }
}

class Bar {
    public uesStatic() {
        Bar.OnTouch((i: number) => {
            Log.showInfo();
            this.noise();
        });
    }

    public static OnTouch(func: (number) => void) {

    }

    public noise() {

    }
}

