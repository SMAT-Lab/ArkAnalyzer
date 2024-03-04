function render() {
    Scroll.create();
    Scroll.width('100%');
    Scroll.height('100%');
    Flex.create({ direction: FlexDirection.Column, alignItems: ItemAlign.Center });
    let earlierCreatedChild_2: MyButton = (this && this.findChildById) ? this.findChildById("2") as MyButton : undefined;
    if (earlierCreatedChild_2 == undefined) {
        View.create(new MyButton("2", this, {
            content: "buffer:收集输出值，直到提供的observable发出才将收集到的值作为数组发出",
            onClickListener: () => {
                this.buffer();
            }
        }));
    }
    else {
        earlierCreatedChild_2.updateWithValueParams({
            content: "buffer:收集输出值，直到提供的observable发出才将收集到的值作为数组发出",
            onClickListener: () => {
                this.buffer();
            }
        });
        View.create(earlierCreatedChild_2);
    }
    let earlierCreatedChild_3: MyButton = (this && this.findChildById) ? this.findChildById("3") as MyButton : undefined;
    if (earlierCreatedChild_3 == undefined) {
        View.create(new MyButton("3", this, {
            content: "bufferCount:收集发出的值，直到收集完提供的数量的值才将其作为数组发出",
            onClickListener: () => {
                this.bufferCount();
            }
        }));
    }
    else {
        earlierCreatedChild_3.updateWithValueParams({
            content: "bufferCount:收集发出的值，直到收集完提供的数量的值才将其作为数组发出",
            onClickListener: () => {
                this.bufferCount();
            }
        });
        View.create(earlierCreatedChild_3);
    }
    let earlierCreatedChild_4: MyButton = (this && this.findChildById) ? this.findChildById("4") as MyButton : undefined;
    if (earlierCreatedChild_4 == undefined) {
        View.create(new MyButton("4", this, { content: "bufferTime:收集发出的值，直到经过了提供的时间才将其作为数组发出", onClickListener: () => {
                this.bufferTime();
            } }));
    }
    else {
        earlierCreatedChild_4.updateWithValueParams({
            content: "bufferTime:收集发出的值，直到经过了提供的时间才将其作为数组发出", onClickListener: () => {
                this.bufferTime();
            }
        });
        View.create(earlierCreatedChild_4);
    }
    let earlierCreatedChild_5: MyButton = (this && this.findChildById) ? this.findChildById("5") as MyButton : undefined;
    if (earlierCreatedChild_5 == undefined) {
        View.create(new MyButton("5", this, {
            content: "bufferToggle:开启开关以捕获源observable所发出的值，关闭开关以将缓冲的值作为数组发出",
            onClickListener: () => {
                this.bufferToggle();
            }
        }));
    }
    else {
        earlierCreatedChild_5.updateWithValueParams({
            content: "bufferToggle:开启开关以捕获源observable所发出的值，关闭开关以将缓冲的值作为数组发出",
            onClickListener: () => {
                this.bufferToggle();
            }
        });
        View.create(earlierCreatedChild_5);
    }
    let earlierCreatedChild_6: MyButton = (this && this.findChildById) ? this.findChildById("6") as MyButton : undefined;
    if (earlierCreatedChild_6 == undefined) {
        View.create(new MyButton("6", this, { content: "bufferWhen:收集值，直到关闭选择器发出值才发出缓冲的值", onClickListener: () => {
                this.bufferWhen();
            } }));
    }
    else {
        earlierCreatedChild_6.updateWithValueParams({
            content: "bufferWhen:收集值，直到关闭选择器发出值才发出缓冲的值", onClickListener: () => {
                this.bufferWhen();
            }
        });
        View.create(earlierCreatedChild_6);
    }
    let earlierCreatedChild_7: MyButton = (this && this.findChildById) ? this.findChildById("7") as MyButton : undefined;
    if (earlierCreatedChild_7 == undefined) {
        View.create(new MyButton("7", this, { content: "concatMap:将值映射成内部observable，并按顺序订阅和发出", onClickListener: () => {
                this.concatMap();
            } }));
    }
    else {
        earlierCreatedChild_7.updateWithValueParams({
            content: "concatMap:将值映射成内部observable，并按顺序订阅和发出", onClickListener: () => {
                this.concatMap();
            }
        });
        View.create(earlierCreatedChild_7);
    }
    let earlierCreatedChild_8: MyButton = (this && this.findChildById) ? this.findChildById("8") as MyButton : undefined;
    if (earlierCreatedChild_8 == undefined) {
        View.create(new MyButton("8", this, { content: "concatMapTo:当前一个observable完成时订阅提供的observable并发出值", onClickListener: () => {
                this.concatMapTo();
            } }));
    }
    else {
        earlierCreatedChild_8.updateWithValueParams({
            content: "concatMapTo:当前一个observable完成时订阅提供的observable并发出值", onClickListener: () => {
                this.concatMapTo();
            }
        });
        View.create(earlierCreatedChild_8);
    }
    let earlierCreatedChild_9: MyButton = (this && this.findChildById) ? this.findChildById("9") as MyButton : undefined;
    if (earlierCreatedChild_9 == undefined) {
        View.create(new MyButton("9", this, { content: "exhaustMap:映射成内部observable，忽略其他值直到该observable完成", onClickListener: () => {
                this.exhaustMap();
            } }));
    }
    else {
        earlierCreatedChild_9.updateWithValueParams({
            content: "exhaustMap:映射成内部observable，忽略其他值直到该observable完成", onClickListener: () => {
                this.exhaustMap();
            }
        });
        View.create(earlierCreatedChild_9);
    }
    let earlierCreatedChild_10: MyButton = (this && this.findChildById) ? this.findChildById("10") as MyButton : undefined;
    if (earlierCreatedChild_10 == undefined) {
        View.create(new MyButton("10", this, { content: "expand:递归调用提供的函数", onClickListener: () => {
                this.expand();
            } }));
    }
    else {
        earlierCreatedChild_10.updateWithValueParams({
            content: "expand:递归调用提供的函数", onClickListener: () => {
                this.expand();
            }
        });
        View.create(earlierCreatedChild_10);
    }
    let earlierCreatedChild_11: MyButton = (this && this.findChildById) ? this.findChildById("11") as MyButton : undefined;
    if (earlierCreatedChild_11 == undefined) {
        View.create(new MyButton("11", this, { content: "groupBy:基于提供的值分组成多个observables", onClickListener: () => {
                this.groupBy();
            } }));
    }
    else {
        earlierCreatedChild_11.updateWithValueParams({
            content: "groupBy:基于提供的值分组成多个observables", onClickListener: () => {
                this.groupBy();
            }
        });
        View.create(earlierCreatedChild_11);
    }
    let earlierCreatedChild_12: MyButton = (this && this.findChildById) ? this.findChildById("12") as MyButton : undefined;
    if (earlierCreatedChild_12 == undefined) {
        View.create(new MyButton("12", this, { content: "map:对源observable的每个值应用投射函数", onClickListener: () => {
                this.map();
            } }));
    }
    else {
        earlierCreatedChild_12.updateWithValueParams({
            content: "map:对源observable的每个值应用投射函数", onClickListener: () => {
                this.map();
            }
        });
        View.create(earlierCreatedChild_12);
    }
    let earlierCreatedChild_13: MyButton = (this && this.findChildById) ? this.findChildById("13") as MyButton : undefined;
    if (earlierCreatedChild_13 == undefined) {
        View.create(new MyButton("13", this, { content: "mapTo:将每个发出值映射成常量", onClickListener: () => {
                this.mapTo();
            } }));
    }
    else {
        earlierCreatedChild_13.updateWithValueParams({
            content: "mapTo:将每个发出值映射成常量", onClickListener: () => {
                this.mapTo();
            }
        });
        View.create(earlierCreatedChild_13);
    }
    let earlierCreatedChild_14: MyButton = (this && this.findChildById) ? this.findChildById("14") as MyButton : undefined;
    if (earlierCreatedChild_14 == undefined) {
        View.create(new MyButton("14", this, { content: "mergeMap:映射成observable并发出值", onClickListener: () => {
                this.mergeMap();
            } }));
    }
    else {
        earlierCreatedChild_14.updateWithValueParams({
            content: "mergeMap:映射成observable并发出值", onClickListener: () => {
                this.mergeMap();
            }
        });
        View.create(earlierCreatedChild_14);
    }
    let earlierCreatedChild_15: MyButton = (this && this.findChildById) ? this.findChildById("15") as MyButton : undefined;
    if (earlierCreatedChild_15 == undefined) {
        View.create(new MyButton("15", this, {
            content: "partition:Split one observable into two based on provided predicate",
            onClickListener: () => {
                this.partition();
            }
        }));
    }
    else {
        earlierCreatedChild_15.updateWithValueParams({
            content: "partition:Split one observable into two based on provided predicate",
            onClickListener: () => {
                this.partition();
            }
        });
        View.create(earlierCreatedChild_15);
    }
    let earlierCreatedChild_16: MyButton = (this && this.findChildById) ? this.findChildById("16") as MyButton : undefined;
    if (earlierCreatedChild_16 == undefined) {
        View.create(new MyButton("16", this, { content: "pluck:选择属性来发出", onClickListener: () => {
                this.pluck();
            } }));
    }
    else {
        earlierCreatedChild_16.updateWithValueParams({
            content: "pluck:选择属性来发出", onClickListener: () => {
                this.pluck();
            }
        });
        View.create(earlierCreatedChild_16);
    }
    let earlierCreatedChild_17: MyButton = (this && this.findChildById) ? this.findChildById("17") as MyButton : undefined;
    if (earlierCreatedChild_17 == undefined) {
        View.create(new MyButton("17", this, {
            content: "reduce:将源observalbe的值归并为单个值，当源observable完成时将这个值发出",
            onClickListener: () => {
                this.reduce();
            }
        }));
    }
    else {
        earlierCreatedChild_17.updateWithValueParams({
            content: "reduce:将源observalbe的值归并为单个值，当源observable完成时将这个值发出",
            onClickListener: () => {
                this.reduce();
            }
        });
        View.create(earlierCreatedChild_17);
    }
    let earlierCreatedChild_18: MyButton = (this && this.findChildById) ? this.findChildById("18") as MyButton : undefined;
    if (earlierCreatedChild_18 == undefined) {
        View.create(new MyButton("18", this, { content: "scan:随着时间的推移进行归并", onClickListener: () => {
                this.scan();
            } }));
    }
    else {
        earlierCreatedChild_18.updateWithValueParams({
            content: "scan:随着时间的推移进行归并", onClickListener: () => {
                this.scan();
            }
        });
        View.create(earlierCreatedChild_18);
    }
    let earlierCreatedChild_19: MyButton = (this && this.findChildById) ? this.findChildById("19") as MyButton : undefined;
    if (earlierCreatedChild_19 == undefined) {
        View.create(new MyButton("19", this, { content: "switchMap:映射成observable，完成前一个内部observable，发出值", onClickListener: () => {
                this.switchMap();
            } }));
    }
    else {
        earlierCreatedChild_19.updateWithValueParams({
            content: "switchMap:映射成observable，完成前一个内部observable，发出值", onClickListener: () => {
                this.switchMap();
            }
        });
        View.create(earlierCreatedChild_19);
    }
    let earlierCreatedChild_20: MyButton = (this && this.findChildById) ? this.findChildById("20") as MyButton : undefined;
    if (earlierCreatedChild_20 == undefined) {
        View.create(new MyButton("20", this, { content: "window:时间窗口值的observable", onClickListener: () => {
                this.window();
            } }));
    }
    else {
        earlierCreatedChild_20.updateWithValueParams({
            content: "window:时间窗口值的observable", onClickListener: () => {
                this.window();
            }
        });
        View.create(earlierCreatedChild_20);
    }
    let earlierCreatedChild_21: MyButton = (this && this.findChildById) ? this.findChildById("21") as MyButton : undefined;
    if (earlierCreatedChild_21 == undefined) {
        View.create(new MyButton("21", this, { content: "windowCount:源observable中的值的observable，每次发出N个值", onClickListener: () => {
                this.windowCount();
            } }));
    }
    else {
        earlierCreatedChild_21.updateWithValueParams({
            content: "windowCount:源observable中的值的observable，每次发出N个值", onClickListener: () => {
                this.windowCount();
            }
        });
        View.create(earlierCreatedChild_21);
    }
    let earlierCreatedChild_22: MyButton = (this && this.findChildById) ? this.findChildById("22") as MyButton : undefined;
    if (earlierCreatedChild_22 == undefined) {
        View.create(new MyButton("22", this, {
            content: "windowTime:在每个提供的时间跨度内，收集源obsercvable中的值的observable",
            onClickListener: () => {
                this.windowTime();
            }
        }));
    }
    else {
        earlierCreatedChild_22.updateWithValueParams({
            content: "windowTime:在每个提供的时间跨度内，收集源obsercvable中的值的observable",
            onClickListener: () => {
                this.windowTime();
            }
        });
        View.create(earlierCreatedChild_22);
    }
    let earlierCreatedChild_23: MyButton = (this && this.findChildById) ? this.findChildById("23") as MyButton : undefined;
    if (earlierCreatedChild_23 == undefined) {
        View.create(new MyButton("23", this, {
            content: "windowToggle:以openings发出为起始，以closingSelector发出为结束，收集并发出源observable中的值的observable",
            onClickListener: () => {
                this.windowToggle();
            }
        }));
    }
    else {
        earlierCreatedChild_23.updateWithValueParams({
            content: "windowToggle:以openings发出为起始，以closingSelector发出为结束，收集并发出源observable中的值的observable",
            onClickListener: () => {
                this.windowToggle();
            }
        });
        View.create(earlierCreatedChild_23);
    }
    let earlierCreatedChild_24: MyButton = (this && this.findChildById) ? this.findChildById("24") as MyButton : undefined;
    if (earlierCreatedChild_24 == undefined) {
        View.create(new MyButton("24", this, {
            content: "windowWhen:在提供的时间帧处关闭窗口，并发出从源observable中收集的值的observable",
            onClickListener: () => {
                this.windowWhen();
            }
        }));
    }
    else {
        earlierCreatedChild_24.updateWithValueParams({
            content: "windowWhen:在提供的时间帧处关闭窗口，并发出从源observable中收集的值的observable",
            onClickListener: () => {
                this.windowWhen();
            }
        });
        View.create(earlierCreatedChild_24);
    }
    Flex.pop();
    Scroll.pop();
}