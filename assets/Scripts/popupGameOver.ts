import { _decorator, Component, Label, Node } from 'cc';
import { UIControl } from './UIControl';
const { ccclass, property } = _decorator;

@ccclass('popupGameOver')
export class popupGameOver extends Component {

    @property({ type: Label, tooltip: "Thời gian còn lại" })
    protected numTime: Label = null;

    @property({ type: Label, tooltip: "Điểm" })
    protected numScore: Label = null;

    init(time: string, score) {
        this.numTime.string = time + "s";
        this.numScore.string = score >= 0 ? score : 0;
        UIControl.instance.onClose();
    }

    protected onDisable(): void {
        this.numTime.string = null;
        this.numScore.string = null;
    }
}


