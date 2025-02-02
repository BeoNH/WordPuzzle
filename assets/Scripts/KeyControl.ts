import { _decorator, Component, EventTouch, Label, Node } from 'cc';
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
    private txtBox = ' ';

    onLoad() {
        KeyControl.Instance = this;

        this.initKeyboard();
    }

    // Khởi tạo bàn phím ảo
    initKeyboard() {
        let listKeyCode = this.keyBoard.getComponentsInChildren(KeyCode);

        for (let i = 0; i < listKeyCode.length; i++) {
            if (this.keyCodeString[i]) {
                listKeyCode[i].setTxt(this.keyCodeString[i]);
            }
        }
    }

    // Chọn ô đáp án
    clickBox(currentTarget?: Node) {
        if(this.txtBox){
            this.confirmBox();
        }
        if (currentTarget) {
            this.targetBox = currentTarget as Node;
            // console.log("Node được click:", this.targetBox.name, "/", this.targetBox['keyCode']);
        }else{
            this.targetBox=null;
            this.txtBox=null;
        }
    }

    // Điền đáp án
    fillTxtBox(txt: string) {
        if (this.targetBox) {
            this.targetBox.getChildByPath(`Label`).getComponent(Label).string = txt;
            this.txtBox = txt;
        }
    }

    // Xác nhận đáp án
    confirmBox() {
        if (this.targetBox && this.targetBox['keyCode']) {
            if (this.txtBox !== this.targetBox['keyCode']) {
                // Sai
                this.fillTxtBox(null);
                WordPuzzle.Instance.onWrongInput();
            } else {
                //Chính xác
                this.targetBox.off(`click`);
                WordPuzzle.Instance.checkLetters(this.txtBox);
                WordPuzzle.Instance.checkCompletedWord(this.targetBox);
            }
        }
        this.targetBox = null;
    }
}


