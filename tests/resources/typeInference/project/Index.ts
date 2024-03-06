import media from '@ohos.multimedia.media';
const TAG: string = '[AVPlayerModel]';
export default class AVPlayerModel {
    private avPlayer: media.AVPlayer;
    private context;
    constructor(context) {
        this.context = context;
    }
    func(){
        this.avPlayer.on('seekDone', (seekDoneTime) => {
        Logger.info(TAG, `AVPlayer seek succeeded, seek time is ${seekDoneTime}`);
    });
    }

    
}