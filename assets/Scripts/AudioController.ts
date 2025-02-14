import { _decorator, AudioSource, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AudioController')
export class AudioController extends Component {
    public static Instance: AudioController;

    @property({ type: Node, tooltip: "iconInMenu" })
    private iconMenu: Node = null;
    // @property({ type: Node, tooltip: "iconInGame" })
    // private iconGame: Node = null;

    volume = 1;

    protected onLoad(): void {
        AudioController.Instance = this;
    }

    ClickOnOff() {
        this.volume == 1 ? this.volume = 0 : this.volume = 1;
        this.node.children.forEach(e => {
            e.getComponent(AudioSource).volume = this.volume;
            if(this.volume == 1 && e == this.node.getChildByName("music")){
                e.getComponent(AudioSource).volume = 0.2;
            }
        })
    }

    protected update(dt: number): void {
        this.iconMenu.children[0].active = this.volume == 0;
        // this.iconGame.children[0].active = this.volume == 0;
    }

    Click() {
        this.node.getChildByName("clickBtn").getComponent(AudioSource).play();
    }

    StartGame() {
        this.node.getChildByName("start").getComponent(AudioSource).play();
    }

    EndGame() {
        this.node.getChildByName("end").getComponent(AudioSource).play();
    }

    OpenHint(): Promise<void> {
        const audioSource = this.node.getChildByName("OpenHint").getComponent(AudioSource);
        audioSource.play();
    
        return new Promise((resolve) => {
            // Lấy thời lượng của clip (tính bằng giây) và chuyển thành mili-giây
            const duration = audioSource.clip.getDuration() * 140;
            setTimeout(() => {
                resolve();
            }, duration);
        });
    }

    OpenWord() {
        this.node.getChildByName("OpenWord").getComponent(AudioSource).play();
    }

    RightWord() {
        this.node.getChildByName("rightWord").getComponent(AudioSource).play();
    }

    WrongWord() {
        this.node.getChildByName("wrongWord").getComponent(AudioSource).play();
    }
}


