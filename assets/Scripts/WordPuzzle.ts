import { _decorator, Button, Color, Component, EventHandle, EventHandler, instantiate, Label, Layout, Node, Prefab, Sprite } from 'cc';
import { GameManager } from './GameManager';
import { KeyControl } from './KeyControl';
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

    @property({ type: Prefab, tooltip: "Hộp chứa từ" })
    protected targetBox: Prefab = null;


    private isGameover: boolean = false;
    private numTime;
    private numScore;


    onLoad(): void {
        WordPuzzle.Instance = this;

        this.resetGame();
    }

    start() {

    }

    update(deltaTime: number) {

    }

    //Khởi tạo lại game
    resetGame() {
        this.layoutTargetWord.removeAllChildren();
        this.layoutAllLetters.forEach(e => { e.removeAllChildren(); e.active = false });
        this.numTime = GameManager.data.countdown;
        this.numScore = GameManager.data.max_score;
        this.questionLabel.string = GameManager.data.question;
        this.isGameover = false;


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
            letter.getChildByPath(`BG`).getComponent(Sprite).color = new Color().fromHEX('#A5CCA0');
            letter.getChildByPath(`Label`).getComponent(Label).string = item;
            letter[`keyCode`] = item;
            letter.off(`click`);
            letter.on(`click`, () => {
                if (!this.isGameover) {
                    this.checkLetters(item);
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
                let bgNode = charNode.getChildByPath(`BG`);

                if (char !== ' ') {
                    if (j == GameManager.data.keyAnswer) {
                        bgNode.getComponent(Sprite).color = new Color().fromHEX('#E4E195');
                    }
                    charNode['keyCode'] = char;
                    charNode['pos'] = [i, j];
                    charNode.off(`click`);
                    charNode.on(`click`, () => {
                        if (!this.isGameover) {
                            KeyControl.Instance.clickBox(charNode);
                        }
                    });
                } else {
                    bgNode.active = false;
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
        this.scoreLabel.string = `${this.numScore}`;
    }

    // Cập nhật thời gian
    private updateTimeLabel() {
        const minutes = Math.floor(this.numTime / 60);
        const seconds = this.numTime % 60;
        this.timeLabel.string = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    private endGame() {
        clearInterval(this.timeInterval);
        this.isGameover = true;
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

        this.layoutAllLetters.forEach(layout => {
            layout.children.forEach(e => {
                if (e['keyCode'] === txt) {
                    const label = e.getChildByPath(`Label`).getComponent(Label);
                    if (label.string.trim() === "") {
                        label.string = txt;
                    }
                }
            });
        });

        this.layoutTargetWord.children.forEach(layout => {
            layout.children.forEach(e => {
                if (e['keyCode'] === txt) {
                    const label = e.getChildByPath(`Label`).getComponent(Label);
                    if (label.string.trim() === "") {
                        label.string = txt;
                        e.off(`click`);
                    }
                }
            });
        });
    }

    // Kiểm tra hoàn thành từ
    checkCompletedWord(taget: Node) {
        let bonus = 0;
        let target = taget;

        if (target[`pos`]) {
            const [row, col] = target[`pos`];
            let rowComplete = true;
            let colComplete = true;

            // Kiểm tra hàng (row)
            const rowNodes = this.layoutTargetWord.children[row].children;
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
                    this.endGame();
                }
            }
        }

        this.numScore += bonus;
        this.updateScoreLabel();
    }
}


