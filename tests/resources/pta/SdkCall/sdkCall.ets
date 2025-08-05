import { Font, Router, RouterOptions } from '@kit.ArkUI';
namespace SdkCall {
    class B {}
    function main() {
        let font: Font = new Font();
        let pa = font.getFontByName('a');
    }

    function main2() {
        let b = new RouterOptions();
        let router: Router = new Router();
        router.pushUrl(b);
    }
}