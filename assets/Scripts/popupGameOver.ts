import { _decorator, Component, Label, Node } from 'cc';
import { UIControl } from './UIControl';
import { NumberScrolling } from './NumberScrolling';
import { GameControl } from './GameControl';
const { ccclass, property } = _decorator;

@ccclass('popupGameOver')
export class popupGameOver extends Component {

    @property({ type: Label, tooltip: "Thời gian còn lại" })
    protected numTime: Label = null;

    @property({ type: NumberScrolling, tooltip: "Điểm" })
    protected numScore: NumberScrolling = null;

    private visibleTimestamp: number = 0; // Biến lưu thời gian popup được bật (mili-giây)

    init(time, score) {
        this.numTime.string = `${time}s`;
        let num = score >= 0 ? score : 0;
        this.scheduleOnce(()=>{
            this.numTime.string = `${time}s (+${time * 2})`;
        },0.7)
        this.scheduleOnce(()=>{
            this.numScore.to(num);
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
        this.numTime.string = null;
        this.numScore.to(0);
        this.unschedule(this.checkPopupTime);
    }
}


