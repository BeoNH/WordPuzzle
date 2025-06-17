import { _decorator, Component, instantiate, Label, Node, Prefab } from 'cc';
import { APIManager } from './API_batta/APIManager';
import { UIControl } from './UIControl';
const { ccclass, property } = _decorator;

@ccclass('popupHistory')
export class popupHistory extends Component {
    public static Instance: popupHistory;

    @property({ type: Node, tooltip: "Danh sách lịch sử chơi" })
    protected layoutHistory: Node = null;

    @property({ type: Prefab, tooltip: "Các dòng tỏng bảng" })
    protected itemHis: Prefab = null;

    protected onLoad(): void {
        popupHistory.Instance = this;
    }

    initHistoryList() {
        const url = `/getHistory`;
        const data = {
            "username": APIManager.userDATA?.username,
            // "username": "beonh123",
        };
        APIManager.requestData(`POST`, url, data, res => {
            if (!res) {
                UIControl.instance.onMess(`${url} => ${res}`);
                return;
            }

            const listHis = res.history; // mảng dữ liệu lịch sử

            // Số lượng item cho phần còn lại
            const pool = this.layoutHistory.children;

            // Duyệt qua số lượng item cần hiển thị
            for (let i = 0; i < listHis.length; i++) {
                let item: Node;
                if (i < pool.length) {
                    item = pool[i];
                    item.active = true;
                } else {
                    item = instantiate(this.itemHis);
                    item.parent = this.layoutHistory;
                    item.active = true;
                }

                // Cập nhật thông tin cho item
                item.getChildByPath("txtDate").getComponent(Label).string = this.formatDate(listHis[i].date);
                item.getChildByPath("txtTime").getComponent(Label).string = listHis[i].numTime + "s";
                item.getChildByPath("txtScore").getComponent(Label).string = listHis[i].numScore;
            }

            console.log(new Date(listHis[0].date))


            // Ẩn đi những item dư thừa
            for (let k = listHis.length; k < pool.length; k++) {
                pool[k].active = false;
            }
        });
    }

    // Cấu hình lại Ngày hiện thị
    private formatDate(dateString: string): string {
        const date: Date = new Date(dateString);
        const datePart: string = date.toDateString().split(' ').slice(1).join('_');
        const timePart: string = date.toTimeString().split(' ')[0];
        return `${datePart} ${timePart}`;
      }

}


