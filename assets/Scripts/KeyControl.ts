import { _decorator, Component, EventTouch, Label, Node } from 'cc';
import { KeyCode } from './KeyCode';
const { ccclass, property } = _decorator;

@ccclass('KeyControl')
export class KeyControl extends Component {
    public static Instance: KeyControl;

    @property({ type: Node, tooltip: "Bàn phím ảo" })
    protected keyBoard: Node = null;

    private keyCodeString: string = 'QWERTYUIOPASDFGHJKLZXCVBNM';
    private targetBox: Node = null;

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
    clickBox(event: EventTouch){
        if (event?.currentTarget) {
            this.targetBox = event.currentTarget as Node;
            console.log("Node được click:", this.targetBox.name);
        }
    }

    // Điền đáp án
    fillTxtBox(txt: string){
        if(this.targetBox){
            this.targetBox.getChildByPath(`Label`).getComponent(Label).string = txt;
        }
    }

    // Xác nhận đáp án
    confirmBox(){
        this.targetBox = null;
    }
}


