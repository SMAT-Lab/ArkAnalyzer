import animator, { AnimatorResult } from '@ohos.animator';
let backAnimator: AnimatorResult = animator.createAnimator({
    duration: 2000,
    easing: "ease",
    delay: 0,
    fill: "forwards",
    direction: "normal",
    iterations: 1,
    begin: 100,
    end: 200
});
backAnimator.onfinish();
backAnimator.onrepeat = () => {
    console.info('backAnimator repeat');
};
backAnimator.oncancel = () => {
    console.info('backAnimator cancel');
};
backAnimator.onframe = (value: number) => {
    console.info('backAnimator cancel');
};