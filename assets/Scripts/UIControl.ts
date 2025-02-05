import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UIControl')
export class UIControl extends Component {

    @property({ type: Node, tooltip: "thông tin" })
    private popupInfo: Node = null;
    @property({ type: Node, tooltip: "hết game" })
    private popupGameOver: Node = null;

    onOpen(e, str: string) {
        switch (str) {
            case `info`:
                this.popupInfo.active = true;
                break;
        }
    }

    onClose() {
        this.popupInfo.active = false;
        this.popupGameOver.active = false;
    }
}


