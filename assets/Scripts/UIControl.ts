import { _decorator, Component, Label, Node } from 'cc';
import { AudioController } from './AudioController';
import { popupRank } from './popupRank';
import { popupHistory } from './popupHistory';
const { ccclass, property } = _decorator;

@ccclass('UIControl')
export class UIControl extends Component {
    public static instance: UIControl = null;

    @property({ type: Node, tooltip: "thông tin" })
    private popupInfo: Node = null;
    @property({ type: Node, tooltip: "Bảng xếp hạng" })
    private popupRank: Node = null;
    @property({ type: Node, tooltip: "Lịch sử" })
    private popupHistory: Node = null;
    @property({ type: Node, tooltip: "Thoát game" })
    private popupOutGame: Node = null;

    @property({ type: Node, tooltip: "UI Mẫ lỗi Login" })
    private popupErroLogin: Node = null;

    protected onLoad(): void {
        UIControl.instance = this;
    }

    onOpen(e, str: string) {
        AudioController.Instance.Click();
        switch (str) {
            case `info`:
                this.popupInfo.active = true;
                break;
            case `rank`:
                this.popupRank.active = true;
                popupRank.Instance.initRankingList();
                break;
            case `history`:
                this.popupHistory.active = true;
                popupHistory.Instance.initHistoryList();
                break;
            case `out`:
                this.popupOutGame.active = true;
                break;
        }
    }

    onClose() {
        this.popupInfo.active = false;
        this.popupRank.active = false;
        this.popupHistory.active = false;
        this.popupOutGame.active = false;
    }

    onMess(txt: string) {
        this.popupErroLogin.active = true;
        this.popupErroLogin.getChildByPath(`txt`).getComponent(Label).string = txt;
        this.scheduleOnce(() => {
            this.popupErroLogin.active = false;
        }, 2)
    }
}


