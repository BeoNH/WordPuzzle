import { _decorator, Component, Label, Node } from 'cc';
import { UIControl } from './UIControl';
import { NumberScrolling } from './NumberScrolling';
import { GameControl } from './GameControl';
const { ccclass, property } = _decorator;

@ccclass('popupGameOver')
export class popupGameOver extends Component {

    @property({ type: Label, tooltip: "Thời gian chơi" })
    protected numTimePlay: Label = null;

    @property({ type: Label, tooltip: "Thời gian còn lại" })
    protected numTimeRemain: Label = null;

    @property({ type: NumberScrolling, tooltip: "Điểm" })
    protected numScore: NumberScrolling = null;

    @property({ type: Label, tooltip: "Thưởng cộng thêm" })
    protected numBonus: Label = null;

    private visibleTimestamp: number = 0; // Biến lưu thời gian popup được bật (mili-giây)

    init(time, score) {
        this.numTimePlay.string = `${180 - time}s`;
        this.numTimeRemain.string = `${time}s`;
        this.numScore.setValue(0);
        this.numBonus.string = `0`;
        let num = score >= 0 ? score : 0;
        this.scheduleOnce(()=>{
            this.numTimeRemain.string = `${time}s`;
        },0.7)
        this.scheduleOnce(()=>{
            this.numScore.to(num);
            this.numBonus.string = `${time * 2}`;
        },0.8)
        UIControl.instance.onClose();
    }

    protected onEnable(): void {
        this.visibleTimestamp = Date.now();
        this.schedule(this.checkPopupTime, 1);
    }

    // Tính số mili-giây đã trôi qua kể từ khi popup bật
    private checkPopupTime(): void {
        const elapsed = Date.now() - this.visibleTimestamp;
        if (elapsed >= 60000) {
            this.closePopup();
        }
    }

    public closePopup(): void {
        this.node.active = false;
        GameControl.Instance.openMenu();
        this.unschedule(this.checkPopupTime);
    }


    protected onDisable(): void {
        this.numTimeRemain.string = null;
        this.numScore.to(0);
        this.unschedule(this.checkPopupTime);
    }
}


