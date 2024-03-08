import promptAction from '@ohos.promptAction';
import media from '@ohos.multimedia.media';
import animator, { AnimatorResult } from '@ohos.animator';
class Index{
    private avPlayer: media.AVPlayer;
    render() {
        let backAnimator: AnimatorResult = animator.createAnimator({});
        backAnimator.onrepeat = () => {
           console.info('backAnimator repeat');
        };
        this.avPlayer.on();
        promptAction.showToast({ message: $r('app.string.authorization') });
    }
}
