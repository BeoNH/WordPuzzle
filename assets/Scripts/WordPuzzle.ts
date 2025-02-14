import { _decorator, Animation, BitmapFont, Button, Color, Component, EventHandle, EventHandler, find, instantiate, Label, Layout, Node, Prefab, Sprite, tween, v3, Vec3 } from 'cc';
import { GameManager } from './GameManager';
import { KeyControl } from './KeyControl';
import { Box } from './Box';
import { popupGameOver } from './popupGameOver';
import { APIManager } from './API_batta/APIManager';
import { AudioController } from './AudioController';
import { UIControl } from './UIControl';
import { GameControl } from './GameControl';
const { ccclass, property } = _decorator;

@ccclass('WordPuzzle')
export class WordPuzzle extends Component {
    public static Instance: WordPuzzle;

    @property({ type: Label, tooltip: "Thời gian chơi game" })
    protected timeLabel: Label = null;

    @property({ type: Label, tooltip: "Điểm của người chơi" })
    protected scoreLabel: Label = null;

    @property({ type: Label, tooltip: "Câu hỏi từ khoá chính gợi ý" })
    protected questionKeyLabel: Label = null;

    @property({ type: Label, tooltip: "Câu hỏi gợi ý các dòng" })
    protected questionRowLabel: Label = null;

    @property({ type: Node, tooltip: "Tất cả chữ cái để tìm" })
    protected layoutAllLetters: Node[] = [];

    @property({ type: Node, tooltip: "Ma trận từ cần tìm" })
    protected layoutTargetWord: Node = null;

    @property({ type: Node, tooltip: "Danh sách các nút âm thanh gợi ý" })
    protected soundPanel: Node = null;

    @property({ type: Prefab, tooltip: "Nút phát âm thanh" })
    protected soundItem: Prefab = null;

    @property({ type: Node, tooltip: "Bàn phím ảo" })
    protected Keyboard: Node = null;

    @property({ type: Prefab, tooltip: "Hộp chứa từ" })
    protected targetBox: Prefab = null;

    @property({ type: Node, tooltip: "UI Hoàn thành game" })
    protected popupGameOver: Node = null;

    private isGameover: boolean = false;
    private numTime;
    private numScore;

    public gameData; // Dữ liệu game
    private isDefault: boolean = false; // kiểm tra dữ liệu mặc định
    private mapNode: Node; // Map chứa thành phần game

    private dataSound: { words: string[], keyWord: string }; //Data chứa từ cần phát âm
    private wordReaded: string[];


    onLoad(): void {
        WordPuzzle.Instance = this;

        this.mapNode = find(`Canvas/GamePlay/Map`);
    }

    start() {

    }

    update(dt: number) {

    }

    //Khởi tạo lại game
    resetGame() {
        this.gameData = GameManager.data;
        APIManager.requestData(`GET`, `/api/suggestions`, null, res => {
            // if (!res) {
            //     UIControl.instance.onMess(`Loading game data failed \n. . .`);
            //     GameControl.Instance.openMenu();
            //     return;
            // }
            // this.gameData = res ? res : GameManager.data;
            this.isDefault = res ? false : true;

            this.layoutTargetWord.removeAllChildren();
            this.soundPanel.removeAllChildren();
            this.layoutAllLetters.forEach(e => { e.removeAllChildren(); e.active = false });
            this.wordReaded = [];
            this.numTime = this.gameData.countdown;
            this.numScore = this.gameData.max_score;
            this.questionKeyLabel.string = this.gameData.question;
            this.questionRowLabel.string = `${1}. ${this.gameData.questionRow[0]}`;
            this.isGameover = false;
            this.popupGameOver.active = false;
            this.dataSound = this.extractGridToWords(this.gameData.answer, this.gameData.keyAnswer);

            this.generateAllLetter();
            this.generateMatrix();

            this.startGame();

            AudioController.Instance.StartGame();
        })
    }

    // Tạo chuỗi các ký tự đáp án
    private generateAllLetter() {
        if (!this.layoutAllLetters || this.layoutAllLetters.length === 0) {
            console.error("layoutAllLetters chưa được thiết lập!");
            return;
        }

        // tính chia đều cho các hàng
        // const lettersPerRow = Math.ceil(this.gameData.all_letter.length / this.layoutAllLetters.length);
        const lettersPerRow = 7;

        AudioController.Instance.OpenWord();
        for (let i = 0; i < this.gameData.all_letter.length; i++) {
            let item = this.gameData.all_letter[i];
            let letter = instantiate(this.targetBox);

            letter.name = `Letter_${i}`;
            letter.getComponent(Box).chanceImage(1);
            letter.getChildByPath(`Label`).getComponent(Label).string = item;
            // letter.scale = v3(0.01, 0.01, 0.01);
            letter[`keyCode`] = item;
            letter.off(`click`);
            letter.on(`click`, () => {
                if (!this.isGameover) {
                    KeyControl.Instance.clickBox();
                    this.checkLetters(letter, item);
                }
            });

            // Chạy hiệu ứng
            this.scheduleOnce(() => {
                this.showLetterEffect(letter);
            }, 0.1 * (i + 1))

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

        for (let i = 0; i < this.gameData.answer.length; i++) {
            let itemRow = this.gameData.answer[i];

            // Tạo từng hàng
            const row = new Node(`${i}`);
            row.parent = this.layoutTargetWord;

            // Tạo từng hàng -> cấu hình phần tử trong hàng -> Thêm gợi ý ? đầu hàng -> Thêm âm thanh gợi ý
            this.setupRowLayout(row);
            this.createBoxesForRow(row, itemRow, i);
            this.setupQuestBoxForRow(row, itemRow, i);
            this.setupSoundBoxForRow(row, itemRow, i);
        }

        // Scale theo số lượng dòng
        const rowCount = this.gameData.answer[0].length;
        let scale = 1;
        const scaleFactor = 0.07;

        if (rowCount > 11) {
            scale = 1 - (rowCount - 11) * scaleFactor;
        }
        this.layoutTargetWord.scale = v3(scale, scale, 1);
    }

    // Cấu hình layout cho hàng
    private setupRowLayout(row: Node): void {
        const layout = row.addComponent(Layout);
        layout.type = Layout.Type.HORIZONTAL;
        layout.resizeMode = Layout.ResizeMode.CONTAINER;
        layout.spacingX = 7;
    }

    // Tạo box cho từng ký tự trong hàng
    private createBoxesForRow(row: Node, itemRow: string[], rowIndex: number): void {
        for (let j = 0; j < itemRow.length; j++) {
            const char = itemRow[j];

            const charNode = instantiate(this.targetBox);
            charNode.name = `${this.targetBox.name}_${rowIndex}_${j}`;
            charNode.parent = row;

            if (char.trim() !== '') {
                // Thiết lập hình ảnh cho box theo ký tự
                charNode.getComponent(Box).chanceImage(0);
                if (j === this.gameData.keyAnswer) {
                    charNode.getComponent(Box).chanceImage(2);
                }

                charNode['keyCode'] = char;
                charNode['pos'] = [rowIndex, j];
                charNode.off('click');
                charNode.on('click', () => {
                    if (!this.isGameover) {
                        KeyControl.Instance.clickBox(charNode);
                        this.questionRowLabel.string = `${rowIndex + 1}. ${this.gameData.questionRow[rowIndex]}`;
                        this.moveKeyboard("up");
                    }
                });

            } else {
                // Ẩn background nếu ký tự là khoảng trắng
                const bgNode = charNode.getChildByPath('BG');
                if (bgNode) {
                    bgNode.active = false;
                }
            }
        }
    }

    // Thiết lập box cho nút "?"
    private setupQuestBoxForRow(row: Node, itemRow: string[], rowIndex: number): void {
        let firstNonIndex = -1;
        for (let i = 1; i < itemRow.length; i++) {
            if (itemRow[i].trim() !== '') {
                firstNonIndex = i - 1;
                break;
            }
        }

        if (firstNonIndex >= 0 && row.children[firstNonIndex]) {
            const questNode = row.children[firstNonIndex];
            const quest = questNode.getChildByPath('Quest');
            const numQuest = questNode.getChildByPath('numQuest');

            if (quest) quest.active = true;
            if (numQuest) {
                numQuest.active = true;
                numQuest.getComponent(Label).string = `${rowIndex + 1}`;
            }

            questNode.off('click');
            questNode.on('click', () => {
                if (!this.isGameover) {
                    this.questionRowLabel.string = `${rowIndex + 1}. ${this.gameData.questionRow[rowIndex]}`;
                }
            });
        }
    }

    // Thiết lập âm thanh gợi ý
    private setupSoundBoxForRow(row: Node, itemRow: string[], rowIndex: number): void {
        let lastIndex = -1;
        for (let i = itemRow.length - 1; i >= 0; i--) {
            if (itemRow[i].trim() !== '') {
                lastIndex = i;
                break;
            }
        }
        this.scheduleOnce(() => {
            if (lastIndex >= 0 && row.children[lastIndex]) {
                let item = instantiate(this.soundItem);
                item.name = `${item.name}_${rowIndex}`;
                item.parent = this.soundPanel;
                item.worldPosition = row.children[lastIndex].worldPosition.clone();
                item.position.add(v3(80, -5, 0));

                item.off('click');
                item.on('click', () => {
                    if (!this.isGameover) {
                        const currentWord = this.dataSound.words[rowIndex];
                        this.onReadWord(currentWord);

                        // Kiểm tra nếu currentWord chưa có trong wordReaded
                        if (this.wordReaded.indexOf(currentWord) === -1) {
                            this.wordReaded.push(currentWord);
                            //trừ điểm khi mở gợi ý
                            this.numScore += GameManager.hintSound;
                            this.updateScoreLabel(GameManager.hintSound, item);
                            item.getComponent(Sprite).grayscale = false;
                        }
                    }
                });

                if (rowIndex === (this.gameData.answer.length - 1)) {
                    let item2 = instantiate(this.soundItem);
                    item2.name = `${item2.name}_Key`;
                    item2.parent = this.soundPanel;
                    item2.worldPosition = row.children[this.gameData.keyAnswer].worldPosition.clone();
                    item2.position.add(v3(0, -80, 0));

                    item2.off('click');
                    item2.on('click', () => {
                        if (!this.isGameover) {
                            const currentWord = this.dataSound.keyWord;
                            this.onReadWord(currentWord);

                            // Kiểm tra nếu currentWord chưa có trong wordReaded
                            if (this.wordReaded.indexOf(currentWord) === -1) {
                                this.wordReaded.push(currentWord);
                                //trừ điểm khi mở gợi ý
                                this.numScore += GameManager.hintSound;
                                this.updateScoreLabel(GameManager.hintSound, item2);
                                item2.getComponent(Sprite).grayscale = false;
                            }
                        }
                    });
                }
            }
        }, 0.001)

    }

    // Bộ đếm ngược
    private timeInterval: number = null;
    startGame() {
        this.updateScoreLabel();
        this.updateTimeLabel();

        this.timeInterval = setInterval(() => {
            this.numTime -= 1;
            // Trừ điểm mỗi 5 giây
            // if (this.numTime % GameManager.timeStep === 0) {
            //     this.numScore += GameManager.timeScore;
            //     this.updateScoreLabel();
            // }

            this.updateTimeLabel();

            if (this.numTime <= 0 || this.numScore <= 0) {
                this.numScore = 0;
                this.endGame();
            }
        }, 1000);
    }

    // Kết thúc game
    private endGame() {
        AudioController.Instance.EndGame();
        clearInterval(this.timeInterval);
        this.isGameover = true;
        // this.openAllAnswer();

        this.popupGameOver.getComponent(popupGameOver).init(this.numTime, this.numScore);
        this.popupGameOver.active = true;

        // Gửi điểm lên server
        if (!this.isDefault) {
            let data = {
                "username": APIManager.userDATA?.username,
                "score": this.numScore,
                "time": this.numTime
            }
            APIManager.requestData(`POST`, `/api/saveScore`, data, res => {
                console.log("Kết thúc game => Gửi server:", res);
            });
        }

        // console.log("data: ", JSON.stringify(data))
        console.log("Game kết thúc!");
    }

    // Thoát game
    outGame() {
        clearInterval(this.timeInterval);
        this.isGameover = true;

        // Gửi điểm lên server
        if (!this.isDefault) {
            let data = {
                "username": APIManager.userDATA?.username,
                "score": 0,
                "time": 0
            }
            APIManager.requestData(`POST`, `/api/saveScore`, data, res => {
                console.log("Thoát game => Gửi server:", res);
            });
        }
    }

    // Cập nhật thời gian
    private updateTimeLabel() {
        const minutes = Math.floor(this.numTime / 60);
        const seconds = this.numTime % 60;
        this.timeLabel.string = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        // Chạy hiệu ứng nháy đỏ
        if (this.numTime <= 9) {
            this.timeLabel.getComponent(Animation).play();
        }
    }

    // Cập nhật số điểm
    private updateScoreLabel(bonus?: number, targetNode?: Node) {
        let num = this.numScore >= 0 ? this.numScore : 0;
        this.numScore = num;
        this.scoreLabel.string = `${num}`;
        if (bonus) {
            this.showBonusEffect(bonus, targetNode);
        }
    }

    // Hiệu ứng cộng điểm
    private showBonusEffect(bonus: number, target: Node) {
        // Các hằng số cấu hình
        const OFFSET_Y = 60;
        const FONT_SIZE = 40;
        const LINE_HEIGHT = 50;

        // Cache node vị trí ban đầu
        const startPos = target ? target.getWorldPosition().clone() : this.scoreLabel.node.getWorldPosition().clone();

        // Tính toán vị trí khởi tạo và vị trí mục tiêu dựa theo bonus
        const initPos = bonus >= 0 ? startPos.clone().add(v3(0, -OFFSET_Y, 0)) : startPos.clone();
        const offsetY = bonus >= 0 ? 0 : -OFFSET_Y;
        const targetPos = startPos.clone().add(v3(0, offsetY, 0));

        // Tạo node bonus và gán parent
        const bonusNode = new Node("BonusEffect");
        bonusNode.parent = this.mapNode;
        bonusNode.setWorldPosition(initPos);

        // Tạo Label cho node bonus
        const bonusLabel = bonusNode.addComponent(Label);
        bonusLabel.string = bonus >= 0 ? `+${bonus}` : `${bonus}`;
        bonusLabel.color = bonus >= 0 ? new Color(0, 255, 0) : new Color(255, 0, 0);
        bonusLabel.fontSize = FONT_SIZE;
        bonusLabel.lineHeight = LINE_HEIGHT;
        bonusLabel.isBold = true;
        bonusLabel.enableOutline = true;
        bonusLabel.outlineColor = new Color(255, 255, 255);
        bonusLabel.enableShadow = true;
        bonusLabel.shadowColor = new Color(56, 56, 56);

        // Di chuyển node bonus từ vị trí khởi tạo đến vị trí mục tiêu
        tween(bonusNode)
            .to(0.5, { worldPosition: targetPos })
            .call(() => {
                bonusNode.destroy();
            })
            .start();
    }


    // Hiệu ứng hình ảnh gợi ý
    private showLetterEffect(target: Node) {
        target.scale = v3(0.01, 0.01, 0.01);
        tween(target)
            .to(0.7, { scale: v3(1.08, 1.08, 1.08) })
            .to(0.7, { scale: v3(1, 1, 1) })
            .start();
    }


    // Mở toàn bộ đáp án
    private openAllAnswer() {
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

    // Từ sai với đáp án
    onWrongInput(target: Node) {
        this.numScore += GameManager.wrongKey;
        this.updateScoreLabel(GameManager.wrongKey, target);
        this.effectWrong(target);
    }

    // Kiểm tra từ giống với đáp án
    async checkLetters(letter: Node, txt: string) {
        const letters = this.gameData.all_letter;
        if (!letters.includes(txt)) {
            return;
        }

        // Trừ điểm khi mở gợi ý
        this.numScore += GameManager.hintKey;
        this.updateScoreLabel(GameManager.hintKey, letter);

        // chuyển trạng thái gợi ý
        if (letter['keyCode'] === txt) {
            letter.getComponent(Box).chanceImage(0);
            letter.off(`click`);
            const btn = letter.getComponent(Button);
            if (btn) {
                btn.destroy();
            }
        }

        // chuyển trạng thái đáp án
        const moves: Array<{ start: Node, target: Node, txt: string }> = [];
        this.layoutTargetWord.children.forEach(layout => {
            layout.children.forEach(e => {
                if (e['keyCode'] === txt) {
                    // this.moveLetters(letter, e, txt);
                    moves.push({ start: letter, target: e, txt: txt });
                    e.off(`click`);
                    const btn = e.getComponent(Button);
                    if (btn) {
                        btn.destroy();
                    }
                }
            });
        });

        // Chạy các hiệu ứng moveLetters tuần tự
        for (const move of moves) {
            await this.moveLetters(move.start, move.target, move.txt);
            await AudioController.Instance.OpenHint();
        }
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
            AudioController.Instance.OpenWord();
            bonus += GameManager.psecondaryKey;
        }


        // Kiểm tra cột (col)
        if (col === this.gameData.keyAnswer) {
            this.layoutTargetWord.children.forEach(layout => {
                const colNode = layout.children[col];
                const text = colNode.getChildByPath(`Label`).getComponent(Label).string.trim();
                if (!text && colNode[`keyCode`]) {
                    colComplete = false;
                }
            });

            if (colComplete) {
                AudioController.Instance.OpenWord();
                bonus += GameManager.primaryKey;
            }
        }

        this.numScore += bonus;
        this.updateScoreLabel(bonus, taget);
        // if (isBonus) {
        // }

        this.checkAllWords();
    }

    // Kiểm tra qua tất cả các chữ có trong đáp án nếu được mở hết
    checkAllWords() {
        let allRevealed = true;
        this.layoutTargetWord.children.forEach(layout => {
            layout.children.forEach(e => {
                const labelNode = e.getChildByPath('Label');
                if (labelNode) {
                    const text = labelNode.getComponent(Label).string.trim();
                    if (e['keyCode'] && !text) {
                        allRevealed = false;
                    }
                }
            });
        });

        if (allRevealed) {
            this.endGame();
        }
    }

    // Kiểm tra chữ đó đã được mởi hết chưa
    checkWordFillFull(txt: string) {
        let allFull = true;
        this.layoutTargetWord.children.forEach(layout => {
            layout.children.forEach(e => {
                const labelNode = e.getChildByPath('Label');
                if (labelNode) {
                    const text = labelNode.getComponent(Label).string.trim();
                    if (e['keyCode'] && !text && e['keyCode'] == txt) {
                        allFull = false;
                    }
                }
            });
        });

        if (allFull) {
            this.layoutAllLetters.some(layout => {
                return layout.children.some(e => {
                    if (e['keyCode'] === txt) {
                        e.getComponent(Box).chanceImage(0);
                        e.off('click');
                        const btn = e.getComponent(Button);
                        if (btn) {
                            btn.destroy();
                        }
                        return true;
                    }
                    return false;
                });
            });
        }
    }

    // Di chuyển bàn phím ảo khi cần
    moveKeyboard(active: string) {
        const currentPos = this.Keyboard.position;
        let targetPos: Vec3;

        if (active == "up") {
            targetPos = new Vec3(0, 0, 0);
        } else {
            targetPos = new Vec3(0, -400, 0);
        }

        if (currentPos != targetPos) {
            tween(this.Keyboard)
                .to(0.1, { position: targetPos })
                .start();
        }
    }

    // Effect di chuyển đáp án
    moveLetters(start: Node, target: Node, txt: string): Promise<void> {
        return new Promise((resolve) => {
            const label = target.getChildByPath(`Label`).getComponent(Label);
            if (label.string.trim() === "") {
                // Tạo clone của target
                const clone = instantiate(target);
                clone.parent = this.mapNode;
                clone.worldPosition = start.worldPosition.clone();
                clone.getChildByPath(`Label`).getComponent(Label).string = txt;

                const targetPos = target.worldPosition.clone();

                tween(clone)
                    .to(0.2, { worldPosition: targetPos })
                    .call(() => {
                        clone.destroy();
                        label.string = txt;
                        // this.checkCompletedWord(target, false);
                        this.checkCompletedWord(target);
                        resolve();
                    })
                    .start();
            } else {
                resolve();
            }
        });
    }

    // Hiệu ứng khi điền sai từ
    effectWrong(target: Node) {
        const label = target.getChildByPath(`Label`).getComponent(Label);
        label.string = "X";
        label.color = new Color(255, 0, 0);

        tween(target)
            .to(0.05, { angle: 10 })
            .to(0.05, { angle: -10 })
            .to(0.05, { angle: 5 })
            .to(0.05, { angle: -5 })
            .to(0.05, { angle: 0 })
            .call(() => {
                label.string = "";
                label.color = new Color(255, 255, 255);
            })
            .start();
    }

    // Tách ghép các đáp án thành từ có nghĩa
    private extractGridToWords(grid: string[][], keyColumn: number) {
        // Lấy các từ của từng hàng
        const words = grid.map(row => row.filter(char => char !== ' ').join(''));

        // Lấy chữ ở cột keyColumn của mỗi hàng
        const keyWord = grid
            .map(row => row[keyColumn])
            .filter(char => char !== ' ')
            .join('');

        return { words, keyWord };
    }

    // Dùng API Google để đọc text
    private onReadWord(txt: string) {
        var msg = new SpeechSynthesisUtterance(txt);
        window.speechSynthesis.speak(msg);
    }

    // Kiểm tra từ tiếp theo
    getkNextWord(targetNode: Node) {
        if (!targetNode || !targetNode.parent) {
            return null;
        }

        const parent = targetNode.parent;
        const index = parent.children.indexOf(targetNode);

        if (index === -1 || index >= parent.children.length - 1) return null;
        if (!parent.children[index + 1]['keyCode']) return null;

        return parent.children[index + 1];
    }
}


