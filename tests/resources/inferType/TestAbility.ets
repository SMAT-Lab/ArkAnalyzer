import { AbilityConstant, UIAbility, Want } from '@kit.AbilityKit';
import image from '@ohos.multimedia.image';

export class TestRelease extends UIAbility {
    private pixelMap1: Promise<image.PixelMap> | null = null;

    onCreate(): void {
        const imageSource1 = image.createImageSource('file://test1.jpg');
        this.pixelMap1 = imageSource1.createPixelMap();
        imageSource1.release();
        return;
    }

    async onDestroy(): Promise {
        (await this.pixelMap1)?.release();
        return;
    }
}