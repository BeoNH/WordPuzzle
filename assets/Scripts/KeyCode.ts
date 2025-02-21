import { _decorator, CCBoolean, Component, EventKeyboard, Label, Node } from 'cc';
import { KeyControl } from './KeyControl';
const { ccclass, property } = _decorator;

@ccclass('KeyCode')
export class KeyCode extends Component {

    @property({ type: Label, tooltip: "Chữ cái" })
    protected keyLabel: Label = null;

    @property({tooltip: "nút xoá text" })
    protected isBackSpace: boolean = false;

    private defaultTxt = "<<";

    // Cài đặt text cho nút
    setTxt(txt: string) {
        this.defaultTxt = txt;
        this.keyLabel.string = this.defaultTxt;
    }

    // Xử lý bấm
    onClick() {
        // console.log("Nút: ", this.defaultTxt);
        if(this.isBackSpace){
            KeyControl.Instance.fillTxtBox(null);
        }else{
            KeyControl.Instance.fillTxtBox(this.defaultTxt);
        }
    }
}


