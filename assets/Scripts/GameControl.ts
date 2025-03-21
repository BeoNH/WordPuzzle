import { _decorator, Component, Label, Node } from 'cc';
import { APIManager } from './API_batta/APIManager';
import { WordPuzzle } from './WordPuzzle';
import { DEBUG } from 'cc/env';
import { AudioController } from './AudioController';
import { UIControl } from './UIControl';
const { ccclass, property } = _decorator;

if (!DEBUG) {
    console.log = function () { };
}

@ccclass('GameControl')
export class GameControl extends Component {
    public static Instance: GameControl;

    @property({ type: Node, tooltip: "scene gamePlay" })
    private scenePlay: Node = null;
    @property({ type: Node, tooltip: "scene menu" })
    private sceneMenu: Node = null;

    @property({ type: Label, tooltip: "hiển thị số lượt chơi" })
    private labelTurn: Label = null;

    private numTurn: number = 0; // số lượt chơi

    onLoad() {
        GameControl.Instance = this;
        window.addEventListener("beforeunload", this.onBeforeUnload);

        this.sceneMenu.active = true;
        this.scenePlay.active = false;

        // Kiểm tra đăng nhập
        this.loginBatta();
    }

    onDestroy() {
        window.removeEventListener("beforeunload", this.onBeforeUnload);
    }

    // Kiểm tra đóng cửa sổ game
    private onBeforeUnload = (event: Event) => {
        console.log("Người chơi đang đóng cửa sổ hoặc làm mới trang.");
    }

    openMenu() {
        AudioController.Instance.Click();
        this.remainTurn();
        this.sceneMenu.active = true;
        this.scenePlay.active = false;
    }

    openGame() {
        AudioController.Instance.Click();

        if (this.numTurn <= 0) {
            UIControl.instance.onMess(`No turns remaining. \nPlease purchase extra turns to proceed.`);
            return;
        }

        this.sceneMenu.active = false;
        this.scenePlay.active = true;
        WordPuzzle.Instance.resetGame();
    }

    // CHơi lại
    restartGame() {
        AudioController.Instance.Click();

        // Cập nhật số lượt trước khi restart game
        this.remainTurn(remainTurn => {
            if (remainTurn <= 0) {
                this.openMenu();
                UIControl.instance.onMess(`No turns remaining. \nPlease purchase extra turns to proceed.`);
                return;
            }

            WordPuzzle.Instance.resetGame();
        });
    }

    // Đăng nhập Batta lấy thông tin
    private loginBatta() {
        const url = `/api/login`;
        const data = {
            "token": APIManager.urlParam(`token`),
            // "token": `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU4IiwidXNlcm5hbWUiOiJiZW9uaDEyMyIsImVtYWlsIjoiaG9hbmduZ3V5ZW5oYnNAZ21haWwuY29tIiwiaXNDcmVhdG9ycyI6ZmFsc2UsInJhbmsiOiJCcm9uemUiLCJpYXQiOjE3NDEzMTMyMDIsImV4cCI6MTc0MTMyNDAwMn0.SSoMEmjcDZAN39dBiSLTWXp1jb5mUSPjqOZE95R7agI`,
        };
        APIManager.requestData(`POST`, url, data, res => {
            console.log("Login_info: ", res)
            if (!res) {
                UIControl.instance.onMess(`${url} => ${res}`);
                return;
            }
            APIManager.userDATA = res;

            this.numTurn = res.remain_turn;
            this.labelTurn.string = res.remain_turn;
        });
    }

    // Cập nhật thông tin số lượt
    private remainTurn(callback?: (remainTurn: number) => void): void {
        const url = `/api/getTurn`;
        const data = {
            "username": APIManager.userDATA?.username,
        };
        APIManager.requestData(`POST`, url, data, res => {
            if (!res) {
                UIControl.instance.onMess(`${url} => ${res}`);
                return;
            }
            this.numTurn = res.remain_turn;
            this.labelTurn.string = res.remain_turn;
            if (callback) {
                callback(this.numTurn);
            }
        });
    }


}


