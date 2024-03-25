class Logger {
    public showInfo() {
        console.log('info');
    }

    public static shouDebug() {
        console.debug('debug');
    }
}

class UI {
    public onScroll(func: (i: number) => void) {
        func(1);
    }
}


class UITest {
    public foo() {
        const ui = new UI();
        ui.onScroll((i) => {
            const logger = new Logger();
            logger.showInfo();

            Logger.shouDebug();
        });

        Logger.shouDebug();

        const logger = new Logger();
        logger.showInfo();
    }
}