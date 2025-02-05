import { _decorator, BitmapFont, Button, Color, Component, EventHandle, EventHandler, instantiate, Label, Layout, Node, Prefab, Sprite, tween, Vec3 } from 'cc';
import { GameManager } from './GameManager';
import { KeyControl } from './KeyControl';
import { Box } from './Box';
import { popupGameOver } from './popupGameOver';
const { ccclass, property } = _decorator;

@ccclass('WordPuzzle')
export class WordPuzzle extends Component {
    public static Instance: WordPuzzle;

    @property({ type: Label, tooltip: "Thời gian chơi game" })
    protected timeLabel: Label = null;

    @property({ type: Label, tooltip: "Điểm của người chơi" })
    protected scoreLabel: Label = null;

    @property({ type: Label, tooltip: "Câu hỏi gợi ý" })
    protected questionLabel: Label = null;

    @property({ type: Node, tooltip: "Tất cả chữ cái để tìm" })
    protected layoutAllLetters: Node[] = [];

    @property({ type: Node, tooltip: "Ma trận từ cần tìm" })
    protected layoutTargetWord: Node = null;

    @property({ type: Node, tooltip: "Bàn phím ảo" })
    protected Keyboard: Node = null;

    @property({ type: Prefab, tooltip: "Hộp chứa từ" })
    protected targetBox: Prefab = null;

    @property({ type: Node, tooltip: "UI Hoàn thành game" })
    protected popupGameOver: Node = null;

    private isGameover: boolean = false;
    private numTime;
    private numScore;


    onLoad(): void {
        WordPuzzle.Instance = this;
    }

    start() {

    }

    update(dt: number) {

    }

    //Khởi tạo lại game
    resetGame() {
        this.layoutTargetWord.removeAllChildren();
        this.layoutAllLetters.forEach(e => { e.removeAllChildren(); e.active = false });
        this.numTime = GameManager.data.countdown;
        this.numScore = GameManager.data.max_score;
        this.questionLabel.string = GameManager.data.question;
        this.isGameover = false;
        this.popupGameOver.active = false;

        this.generateAllLetter();
        this.generateMatrix();

        this.startGame();
    }

    // Tạo chuỗi các ký tự đáp án
    private generateAllLetter() {
        if (!this.layoutAllLetters || this.layoutAllLetters.length === 0) {
            console.error("layoutAllLetters chưa được thiết lập!");
            return;
        }

        // tính chia đều cho các hàng
        // const lettersPerRow = Math.ceil(GameManager.data.all_letter.length / this.layoutAllLetters.length);
        const lettersPerRow = 7;

        for (let i = 0; i < GameManager.data.all_letter.length; i++) {
            let item = GameManager.data.all_letter[i];
            let letter = instantiate(this.targetBox);

            letter.name = `Letter_${i}`;
            letter.getComponent(Box).chanceImage(1);
            letter.getChildByPath(`Label`).getComponent(Label).string = item;
            letter[`keyCode`] = item;
            letter.off(`click`);
            letter.on(`click`, () => {
                if (!this.isGameover) {
                    KeyControl.Instance.clickBox();
                    this.checkLetters(item);
                    this.numScore += GameManager.hintKey;
                    this.updateScoreLabel();
                }
            });

            const rowIndex = Math.floor(i / lettersPerRow);
            this.layoutAllLetters[rowIndex].active = true;
            letter.parent = this.layoutAllLetters[rowIndex];
        }
    }


    // Tạo mảng 2 chiều đáp án
    private generateMatrix() {
        if (!this.layoutTargetWord) {
            console.error("layoutTargetWords chưa được thiết lập!");
            return;
        }

        for (let i = 0; i < GameManager.data.answer.length; i++) {
            let itemRow = GameManager.data.answer[i];

            // Tạo từng hàng
            const row = new Node(`${i}`);
            row.parent = this.layoutTargetWord;

            let layout = row.addComponent(Layout);
            layout.type = Layout.Type.HORIZONTAL;
            layout.resizeMode = Layout.ResizeMode.CONTAINER;
            layout.spacingX = 5;

            // Gắn box tương ứng theo ký tự
            for (let j = 0; j < itemRow.length; j++) {
                const char = itemRow[j];

                let charNode = instantiate(this.targetBox);
                charNode.name = `${this.targetBox.name}_${i}_${j}`;
                charNode.parent = row;

                if (char !== ' ') {
                    charNode.getComponent(Box).chanceImage(0);
                    if (j == GameManager.data.keyAnswer) {
                        charNode.getComponent(Box).chanceImage(2);
                    }
                    charNode['keyCode'] = char;
                    charNode['pos'] = [i, j];
                    charNode.off(`click`);
                    charNode.on(`click`, () => {
                        if (!this.isGameover) {
                            KeyControl.Instance.clickBox(charNode);
                            this.moveKeyboard("up");
                        }
                    });
                } else {
                    charNode.getChildByPath(`BG`).active = false;
                }
            }
        }
    }

    // Bộ đếm ngược
    private timeInterval: number = null;
    startGame() {
        this.updateScoreLabel();
        this.updateTimeLabel();

        this.timeInterval = setInterval(() => {
            this.numTime -= 1;
            if (this.numTime % GameManager.timeStep === 0) {
                this.numScore += GameManager.timeScore; // Trừ điểm mỗi 5 giây
            }

            this.updateScoreLabel();
            this.updateTimeLabel();

            if (this.numTime <= 0 || this.numScore <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    // Cập nhật số điểm
    private updateScoreLabel() {
        let num = this.numScore >= 0 ? this.numScore : 0;
        this.scoreLabel.string = `${num}`;
    }

    // Cập nhật thời gian
    private updateTimeLabel() {
        const minutes = Math.floor(this.numTime / 60);
        const seconds = this.numTime % 60;
        this.timeLabel.string = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    // Kết thúc game
    private endGame() {
        clearInterval(this.timeInterval);
        this.isGameover = true;
        this.openAllAnswer();
        this.scheduleOnce(() => {
            this.popupGameOver.getComponent(popupGameOver).init(this.numTime, this.numScore);
            this.popupGameOver.active = true;
        }, 1);

        console.log("Game kết thúc!");

        // Gửi điểm lên server
        // APIManager.requestData(`/game/end`, { score: this.numScore }, res => {
        //     console.log("Điểm đã gửi về server:", res);
        // });
    }

    // Từ sai với đáp án
    onWrongInput() {
        this.numScore += GameManager.wrongKey;
        this.updateScoreLabel();
    }

    // Kiểm tra từ giống với đáp án
    checkLetters(txt: string) {
        const letters = GameManager.data.all_letter;
        if (!letters.includes(txt)) {
            return;
        }

        // chuyển trạng thái gợi ý
        this.layoutAllLetters.forEach(layout => {
            layout.children.forEach(e => {
                if (e['keyCode'] === txt) {
                    e.getComponent(Box).chanceImage(0);
                    e.off(`click`);
                    const btn = e.getComponent(Button);
                    if (btn) {
                        btn.destroy();
                    }
                }
            });
        });

        // chuyển trạng thái đáp án
        this.layoutTargetWord.children.forEach(layout => {
            layout.children.forEach(e => {
                if (e['keyCode'] === txt) {
                    const label = e.getChildByPath(`Label`).getComponent(Label);
                    if (label.string.trim() === "") {
                        label.string = txt;
                    }

                    e.off(`click`);
                    const btn = e.getComponent(Button);
                    if (btn) {
                        btn.destroy();
                    }

                    this.checkCompletedWord(e, false);
                }
            });
        });
    }

    // Kiểm tra hoàn thành từ
    checkCompletedWord(taget: Node, isBonus: boolean = true) {
        if (!taget[`pos`]) return;

        let bonus = 0;
        let rowComplete = true;
        let colComplete = true;
        const [row, col] = taget[`pos`];

        // Kiểm tra hàng (row)
        const rowNodes = this.layoutTargetWord.children[row]?.children;
        rowNodes.forEach(node => {
            const text = node.getChildByPath(`Label`).getComponent(Label).string.trim();
            if (!text && node[`keyCode`]) {
                rowComplete = false;
                return;
            }
        })

        if (rowComplete) {
            bonus += GameManager.psecondaryKey;
        }


        // Kiểm tra cột (col)
        if (col === GameManager.data.keyAnswer) {
            this.layoutTargetWord.children.forEach(layout => {
                const colNode = layout.children[col];
                const text = colNode.getChildByPath(`Label`).getComponent(Label).string.trim();
                if (!text && colNode[`keyCode`]) {
                    colComplete = false;
                }
            });

            if (colComplete) {
                bonus += GameManager.primaryKey;
            }
        }

        if (isBonus) {
            this.numScore += bonus;
            this.updateScoreLabel();
        }

        if (col === GameManager.data.keyAnswer && colComplete) {
            this.endGame();
        }
    }

    // Di chuyển bàn phím ảo khi cần
    moveKeyboard(active: string) {
        const currentPos = this.Keyboard.position;
        let targetPos: Vec3;

        if (active == "up") {
            targetPos = new Vec3(0, 0, 0);
        } else {
            targetPos = new Vec3(0, -700, 0);
        }

        if (currentPos != targetPos) {
            tween(this.Keyboard)
                .to(0.1, { position: targetPos })
                .start();
        }
    }

    // Mở toàn bộ đáp án
    openAllAnswer() {
        this.layoutTargetWord.children.forEach(layout => {
            layout.children.forEach(e => {
                if (e['keyCode']) {
                    const label = e.getChildByPath(`Label`).getComponent(Label);
                    if (label.string.trim() === "") {
                        label.string = e['keyCode'];
                    }
                    const btn = e.getComponent(Button);
                    if (btn) {
                        btn.destroy();
                    }
                    e.off(`click`);
                }
            });
        });
    }
}


