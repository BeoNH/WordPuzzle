import { _decorator, Component, Node, Sprite, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Box')
export class Box extends Component {
    @property({ type: Sprite, tooltip: "Hình ảnh nền hộp" })
    protected imageBox: Sprite = null;

    @property({ type: SpriteFrame, tooltip: "Tất cả hình nền" })
    protected listImageBox: SpriteFrame[] = [];

    // Đổi màu hình nền
    chanceImage(idImage: number) {
        if (!this.imageBox) {
            console.error("imageBox chưa được gán!");
            return;
        }

        if (this.listImageBox[idImage]) {
            this.imageBox.spriteFrame = this.listImageBox[idImage];
        } else {
            console.warn(`Không tìm thấy hình ảnh tại vị trí ${idImage} trong listImageBox.`);
        }
    }
}


