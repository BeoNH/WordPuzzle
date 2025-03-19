import { _decorator, Animation, Component, Node, tween, UITransform, v3, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AnimationController')
export class AnimationController extends Component {
    public static Instance: AnimationController;
    protected onLoad(): void {
        AnimationController.Instance = this;
    }

    //// Class để gọi mở rộng các nút gợi ý

    @property({ type: Node, tooltip: "Cụm câu hỏi" })
    protected nodeLetter: Node = null;

    @property({ type: Node, tooltip: "Nền Item" })
    protected BG_Item: Node = null;

    protected onDisable(): void {
        this.moveHintLeftRight(`L`);
    }

    // Xác định vị trí đích dựa vào hướng di chuyển
    moveHintLeftRight(dir: string): void {
        let targetPos: Vec3;
        let targetWidth: number;
        
        switch (dir) {
            case "R":
                targetPos = v3(160, 0, 0);
                targetWidth = 183;
                break;
            case "L":
                targetPos = v3(0, 0, 0);
                targetWidth = 0;
                this.stopAnimation();
                break;
            default:
                return;
        }

        tween(this.nodeLetter)
            .to(0.3, { position: targetPos })
            .start();

        const uiTrans = this.BG_Item.getComponent(UITransform);
        tween(uiTrans)
            .to(0.3, { width: targetWidth })
            .start();
    }

    // chạy hiệu ứng hình động
    playAnimation(chil: string) {
        this.stopAnimation();

        this.moveHintLeftRight(`R`);
        this.scheduleOnce(() => {
            let node = this.node.getChildByPath(chil);
            node.active = true;

            const anim = node.getComponent(Animation);
            if (anim) {
                anim.play();
            }
        }, 0.2)
    }
    playAnimationNomal(chil: string){
        this.scheduleOnce(() => {
            let node = this.node.getChildByPath(chil);
            node.active = true;

            const anim = node.getComponent(Animation);
            if (anim) {
                anim.play();
            }
        }, 0.2)
    }
    stopAnimation(): void {
        this.node.children.forEach(child => {
            child.active = false;
            const anim = child.getComponent(Animation);
            if (anim) {
                anim.stop();
                if (anim.defaultClip) {
                    anim.play(anim.defaultClip.name);
                    anim.pause();
                }
            }
        });
    }
}


