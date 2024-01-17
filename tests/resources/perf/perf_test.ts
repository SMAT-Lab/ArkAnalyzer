

class Ability {
    propertyA: string = "";
    propertyB: string = "";
}

class GlobalThis {
    ability!: Ability;
}

class Time {
    static INFO: number[] = [];
    static START: number = 2000;
}

function test1_1(globalThis: GlobalThis) {
    console.log(globalThis.ability.propertyA + globalThis.ability.propertyB);
}

function test1_2(year: number): number {
    let totalDays: number = 348;
    for (let index: number = 0x8000; index > 0x8; index >>= 1) {
        totalDays += ((Time.INFO[year - Time.START] & index) !== 0) ? 1 : 0;
    }

    return totalDays;
}