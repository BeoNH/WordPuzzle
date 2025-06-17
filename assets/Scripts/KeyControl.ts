import { _decorator, Color, Component, Label, Node, Sprite, instantiate } from 'cc';
import { KeyCode } from './KeyCode';
import { WordPuzzle } from './WordPuzzle';
import { AudioController } from './AudioController';
import { Box } from './Box';
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

    // Hàm cập nhật hình ảnh cho BG của một box
    private updateBoxImage(box: Node, onBox: boolean): void {
        if(!box) return;

        const [row, col] = box['pos'];
        const keyAnswer = WordPuzzle.Instance.gameData.keyAnswer;
        const isKeyColumn = (col === keyAnswer);

        // Xác định imageIndex dựa trên trạng thái onBox và vị trí key
        const imageIndex = onBox ? (isKeyColumn ? 4 : 3) : (isKeyColumn ? 2 : 1);

        box.getComponent(Box).chanceImage(imageIndex);
    }


    // Xử lý khi người chơi click vào ô đáp án
    clickBox(currentTarget?: Node) {
        if (this.currentText) {
            this.confirmBox(false);
        }

        if (this.targetBox) {
            this.updateBoxImage(this.targetBox, false);
        }

        if (currentTarget) {
            this.targetBox = currentTarget;
            this.updateBoxImage(this.targetBox, true);
            // console.log("Code: ",currentTarget['keyCode'])
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
    confirmBox(isNext: boolean = true) {
        if (this.targetBox && this.targetBox['keyCode']) {
            this.updateBoxImage(this.targetBox, false);

            // console.log("currentText: ",this.currentText)
            if(this.currentText){
                if (this.currentText !== this.targetBox['keyCode']) {
                    AudioController.Instance.WrongWord();
                    this.fillTxtBox('');
                    WordPuzzle.Instance.onWrongInput(this.targetBox);
                } else {
                    AudioController.Instance.RightWord();
                    this.targetBox.off('click');
                    WordPuzzle.Instance.checkWordFillFull(this.currentText);
                    WordPuzzle.Instance.checkCompletedWord(this.targetBox);
                }
            }
        }
        // Reset trạng thái sau khi xác nhận
        this.currentText = '';
        if (isNext) {
            let nextBox = WordPuzzle.Instance.getkNextWord(this.targetBox);
            this.targetBox = nextBox;
            this.updateBoxImage(this.targetBox, true);
        } else {
            this.targetBox = null;
        }
    }
}