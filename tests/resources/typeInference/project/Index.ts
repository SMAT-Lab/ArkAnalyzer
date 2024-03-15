import promptAction from '@ohos.promptAction';
import media from '@ohos.multimedia.media';
import animator, { AnimatorResult } from '@ohos.animator';
import usb from '@ohos.usbV9';
import { Driver} from '@ohos.UiTest';
class Index{
    private avPlayer: media.AVPlayer;
    render() {
        let driver: Driver = Driver.create();
        let observer = await driver.createUIEventObserver();
        let usbDevices: usb.USBDevice[] = usb.getDevices();
        let backAnimator: AnimatorResult = animator.createAnimator({});
        backAnimator.finish1();
        backAnimator.onrepeat1 = () => {
           console.info('backAnimator repeat');
        };
        this.avPlayer.on();
        promptAction.showToast({ message: $r('app.string.authorization') });
        promptAction.onrepeat1 = () => {
            console.info('backAnimator repeat');
         };
    }
}
