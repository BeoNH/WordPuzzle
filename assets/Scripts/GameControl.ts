import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameControl')
export class GameControl extends Component {

    @property({ type: Node, tooltip: "scene gamePlay" })
    private scenePlay: Node = null;
    @property({ type: Node, tooltip: "scene menu" })
    private sceneMenu: Node = null;

    onLoad() {
        window.addEventListener("beforeunload", this.onBeforeUnload);
        
        this.sceneMenu.active = true;
        this.scenePlay.active = false;
    }


    onDestroy() {
        window.removeEventListener("beforeunload", this.onBeforeUnload);
    }

    // Kiểm tra đóng cửa sổ game
    private onBeforeUnload(event: Event) {
        console.log("Người chơi đang đóng cửa sổ hoặc làm mới trang.");

    }

    openMenu() {
        this.sceneMenu.active = true;
        this.scenePlay.active = false;
    }

    openGame() {
        this.scheduleOnce(()=>{
            this.sceneMenu.active = false;
            this.scenePlay.active = true;
        },0.3)
    }
}


