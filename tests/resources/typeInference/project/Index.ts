import promptAction from '@ohos.promptAction';
class Index extends View {
    render() {
        promptAction.showToast({ message: $r('app.string.authorization') });
    }
}
