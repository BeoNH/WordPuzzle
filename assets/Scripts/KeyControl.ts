import { _decorator, Color, Component, Label, Node, Sprite, instantiate } from 'cc';
import { KeyCode } from './KeyCode';
import { WordPuzzle } from './WordPuzzle';
const { ccclass, property } = _decorator;

@ccclass('KeyControl')
export class KeyControl extends Component {
    public static Instance: KeyControl;

    @property({ type: Node, tooltip: "Bàn phím ảo" })
    protected keyBoard: Node = null;

    private keyCodeString: string = 'QWERTYUIOPASDFGHJKLZXCVBNM';
    private targetBox: Node = null;
    private currentText: string = ''; // Chữ đã điền trong ô

    onLoad() {
        KeyControl.Instance = this;

        this.initKeyboard();
    }

    // Khởi tạo bàn phím ảo dựa trên keyCodeString
    initKeyboard() {
        const listKeyCode = this.keyBoard.getComponentsInChildren(KeyCode);
        for (let i = 0; i < listKeyCode.length; i++) {
            const keyChar = this.keyCodeString[i];
            if (keyChar) {
                listKeyCode[i].setTxt(keyChar);
            }
        }
    }

    // Hàm cập nhật độ mờ (opacity) cho BG của một box
    private updateBoxOpacity(box: Node, alpha: number): void {
        const bgNode = box.getChildByPath('BG');
        if (bgNode) {
            const sprite = bgNode.getComponent(Sprite);
            if (sprite) {
                const { r, g, b } = sprite.color;
                sprite.color = new Color(r, g, b, alpha);
            }
        }
    }

    // Xử lý khi người chơi click vào ô đáp án
    clickBox(currentTarget?: Node) {
        if (this.currentText) {
            this.confirmBox();
        }

        if (this.targetBox) {
            this.updateBoxOpacity(this.targetBox, 255);
        }

        if (currentTarget) {
            this.targetBox = currentTarget;
            this.updateBoxOpacity(this.targetBox, 200);
            console.log("Code: ",currentTarget['keyCode'])
        } else {
            this.targetBox = null;
            this.currentText = '';
        }
    }

    // Điền đáp án vào ô (và cập nhật currentText)
    fillTxtBox(txt: string) {
        if (this.targetBox) {
            const label = this.targetBox.getChildByPath('Label')?.getComponent(Label);
            if (label) {
                label.string = txt;
                this.currentText = txt;
            }
        }
    }

    // Xác nhận đáp án đã điền vào ô
    confirmBox() {
        if (this.targetBox && this.targetBox['keyCode']) {
            this.updateBoxOpacity(this.targetBox, 255);

            if (this.currentText !== this.targetBox['keyCode']) {
                this.fillTxtBox('');
                WordPuzzle.Instance.onWrongInput();
            } else {
                this.targetBox.off('click');
                WordPuzzle.Instance.checkLetters(this.currentText);
                WordPuzzle.Instance.checkCompletedWord(this.targetBox);
            }
        }
        // Reset trạng thái sau khi xác nhận
        this.targetBox = null;
        this.currentText = '';
    }
}