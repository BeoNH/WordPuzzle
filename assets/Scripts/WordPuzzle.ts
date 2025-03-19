import { _decorator, Animation, BitmapFont, Button, Color, Component, EventHandle, EventHandler, EventTouch, find, instantiate, Label, Layout, Node, Prefab, Quat, Sprite, tween, v3, Vec3 } from 'cc';
import { GameManager } from './GameManager';
import { KeyControl } from './KeyControl';
import { Box } from './Box';
import { popupGameOver } from './popupGameOver';
import { APIManager, SERVICE_ASSETS } from './API_batta/APIManager';
import { AudioController } from './AudioController';
import { UIControl } from './UIControl';
import { GameControl } from './GameControl';
// import { AnimationController } from './AnimationController';
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
    protected soundOff: Node = null;

    @property({ type: Node, tooltip: "Danh sách các nút âm thanh gợi ý" })
    protected soundOn: Node = null;

    @property({ type: Prefab, tooltip: "Nút phát âm thanh" })
    protected soundItem: Prefab = null;

    @property({ type: Node, tooltip: "Bàn phím ảo" })
    protected Keyboard: Node = null;

    @property({ type: Prefab, tooltip: "Hộp chứa từ" })
    protected targetBox: Prefab = null;

    @property({ type: Node, tooltip: "UI Hoàn thành game" })
    protected popupGameOver: Node = null;

    @property({ type: Node, tooltip: "Nút bấm các vật phẩm 1" })
    protected iconItem1: Node = null;

    @property({ type: Node, tooltip: "Nút bấm các vật phẩm 2" })
    protected iconItem2: Node = null;

    @property({ type: Node, tooltip: "Nút bấm các vật phẩm 3" })
    protected iconItem3: Node = null;

    private isGameover: boolean = false;
    private numTime;
    private numScore;

    public gameData; // Dữ liệu game
    private isDefault: boolean = false; // kiểm tra dữ liệu mặc định
    private mapNode: Node; // Map chứa thành phần game

    private dataSound: { words: string[], keyWord: string }; //Data chứa từ cần phát âm
    private wordReaded: string[]; // Từ đã được đọc 1 lần

    // Bộ 3 vật phẩm
    private onItem1: boolean = false;
    private onItem2: boolean = false;
    private onItem3: boolean = false;
    private numItemUse: number[] = [0, 0, 0]; // Số lần dùng item
    private save: number[];

    private comboWords: number = 0;

    onLoad(): void {
        WordPuzzle.Instance = this;

        this.mapNode = find(`Canvas/GamePlay/Map`);
        speechSynthesis.getVoices()
    }

    start() {

    }

    update(dt: number) {
        this.updateItemUI()
    }

    // Cập nhật giao diện vật phẩm
    updateItemUI() {
        this.soundOff.active = this.onItem1;
        this.iconItem1.getComponent(Sprite).grayscale = this.numItemUse[0] <= 0;
        this.iconItem2.getComponent(Sprite).grayscale = this.numItemUse[1] <= 0;
        this.iconItem3.getComponent(Sprite).grayscale = this.numItemUse[2] <= 0;

        this.iconItem1.getChildByPath(`num`).getComponent(Label).string = `x${this.numItemUse[0]}`;
        this.iconItem2.getChildByPath(`num`).getComponent(Label).string = `x${this.numItemUse[1]}`;
        this.iconItem3.getChildByPath(`num`).getComponent(Label).string = `x${this.numItemUse[2]}`;
    }

    // Khởi tạo lại game
    resetGame() {
        const data = {
            "username": APIManager.userDATA?.username,
        };

        APIManager.requestData(`POST`, `/api/getSuggestions`, data, res => {
            if (res?.error == 201 || !res) {
                UIControl.instance.onMess(`Loading game data failed \n. . .\n ${res?.message}`);
                GameControl.Instance.openMenu();
                return;
            }

            // Cập nhật dữ liệu game
            this.gameData = res ? res : GameManager.data;
            this.isDefault = !res;

            // Đặt lại trạng thái game
            this.isGameover = false;
            this.popupGameOver.active = false;
            this.wordReaded = [];
            this.numTime = this.gameData.countdown;
            this.numScore = this.gameData.max_score;
            this.numItemUse = [2, 2, 2];
            this.comboWords = 0;

            // Reset giao diện layout
            this.resetUILayout();

            // Xử lý item âm thanh
            this.dataSound = this.extractGridToWords(this.gameData.answer, this.gameData.keyAnswer);
            this.OffAllItem();

            // Tạo lại dữ liệu game
            this.generateAllLetter();
            this.generateMatrix();

            // Bắt đầu game và phát âm thanh
            this.startGame();
            AudioController.Instance.StartGame();
        });
    }

    //======================= BỘ KHỞI TẠO =========================//

    // Reset toàn bộ giao diện UI
    private resetUILayout() {
        this.layoutTargetWord.removeAllChildren();
        this.soundOn.removeAllChildren();
        this.soundOff.removeAllChildren();
        this.soundOff.active = this.onItem1;

        this.layoutAllLetters.forEach(e => {
            e.removeAllChildren();
            e.active = false;
        });

        // Cập nhật UI câu hỏi
        this.questionKeyLabel.string = this.gameData.question;
        this.questionRowLabel.string = `${1}. ${this.gameData.questionRow[0]}`;
    }

    // Tách ghép các đáp án hàng vs cột thành từ có nghĩa
    private extractGridToWords(grid: string[][], keyColumn: number) {
        const words = grid.map(row => row.filter(char => char !== ' ').join(''));
        const keyWord = grid
            .map(row => row[keyColumn])
            .filter(char => char !== ' ')
            .join('');

        return { words, keyWord };
    }

    // Tắt toàn bộ các Item
    private OffAllItem() {
        this.onItem1 = this.onItem2 = this.onItem3 = false;
        [this.iconItem1, this.iconItem2, this.iconItem3].forEach(icon => this.stopAnimation(icon));

        this.layoutAllLetters.forEach(layout => {
            layout.children.forEach(child => {
                this.stopAnimation(child);
            });
        });

        this.layoutTargetWord.children.forEach(layout => {
            layout.children.forEach(child => {
                this.stopAnimation(child);
            });
        });
    }



    // Tạo chuỗi các ký tự gợi ý
    private generateAllLetter() {
        if (!this.layoutAllLetters || this.layoutAllLetters.length === 0) {
            console.error("layoutAllLetters chưa được thiết lập!");
            return;
        }

        // tính chia đều cho các hàng
        // const lettersPerRow = Math.ceil(this.gameData.all_letter.length / this.layoutAllLetters.length);
        const lettersPerRow = 9;
        AudioController.Instance.OpenWord();

        for (let i = 0; i < this.gameData.all_letter.length; i++) {
            let item = this.gameData.all_letter[i];

            let letter = instantiate(this.targetBox);
            letter.name = `Letter_${i}`;
            letter[`keyCode`] = item;
            letter.getComponent(Box).chanceImage(1);
            letter.getChildByPath(`Label`).getComponent(Label).string = item;

            letter.off(`click`);
            letter.on(`click`, () => this.handleLetterClick(letter, item));

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
    private scaleTarget = 1;
    private generateMatrix() {
        if (!this.layoutTargetWord) {
            console.error("layoutTargetWords chưa được thiết lập!");
            return;
        }

        // Scale theo số lượng phần tử dòng
        const rowCount = this.gameData.answer[0].length;
        this.scaleTarget = this.calculateScale(rowCount);
        this.layoutTargetWord.scale = v3(this.scaleTarget, this.scaleTarget, 1);

        // Tạo từng hàng
        for (let i = 0; i < this.gameData.answer.length; i++) {
            let itemRow = this.gameData.answer[i];

            const row = new Node(`${i}`);
            row.parent = this.layoutTargetWord;

            // Tạo từng hàng -> cấu hình phần tử trong hàng -> Thêm gợi ý ? đầu hàng -> Thêm âm thanh gợi ý cuối hàng
            this.setupRowLayout(row);
            this.createBoxesForRow(row, itemRow, i);
            this.setupQuestBoxForRow(row, itemRow, i);
            this.setupHintSound(row, itemRow, i);
        }
    }

    // Cấu hình layout cho hàng
    private setupRowLayout(row: Node): void {
        const layout = row.addComponent(Layout);
        layout.type = Layout.Type.HORIZONTAL;
        layout.resizeMode = Layout.ResizeMode.CONTAINER;
        layout.spacingX = 10;
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
                const boxComponent = charNode.getComponent(Box);
                boxComponent.chanceImage(j === this.gameData.keyAnswer ? 2 : 0);

                charNode['keyCode'] = char;
                charNode['pos'] = [rowIndex, j];
                charNode.off('click');
                charNode.on('click', () => this.handleWordClick(charNode, rowIndex));
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
        let firstNonIndex = itemRow.findIndex(char => char.trim() !== '');

        if (firstNonIndex >= 0 && row.children[firstNonIndex - 1]) {
            const questNode = row.children[firstNonIndex - 1];
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
    private setupHintSound(row: Node, itemRow: string[], rowIndex: number): void {
        let lastIndex = -1;
        for (let i = itemRow.length - 1; i >= 0; i--) {
            if (itemRow[i].trim() !== '') {
                lastIndex = i;
                break;
            }
        }
        console.log(">>>firstNonIndex", lastIndex);


        this.scheduleOnce(() => {
            // Âm thanh theo dòng
            if (lastIndex >= 0 && row.children[lastIndex]) {
                this.createSoundHint(row.children[lastIndex], this.dataSound.words[rowIndex]);
            }

            // Âm thanh cột chính
            if (rowIndex === (this.gameData.answer.length - 1)) {
                let keyBox = row.children[this.gameData.keyAnswer - 1];
                if (keyBox) {
                    this.createSoundHint(keyBox, this.dataSound.keyWord, true);
                }
            }
        }, 0.001)
    }

    // Tạo gợi ý âm thanh
    private createSoundHint(target: Node, word: string, iskey: boolean = false) {
        let item = instantiate(this.soundItem);
        item.name = `${item.name}_${word}`;
        item.parent = this.soundOff;
        item.scale = v3(this.scaleTarget, this.scaleTarget, 1);
        item.worldPosition = target.worldPosition.clone();

        let deviation = 95 * this.scaleTarget;
        item.position.add(v3(deviation, 0, 0));
        if (iskey) {
            item.position.add(v3(0, -deviation, 0));
        }

        item.off('click');
        item.on('click', () => this.handleSoundHintClick(item, word));
    }

    // Tính toán tỷ lệ scale
    private calculateScale(rowCount: number): number {
        if (rowCount >= 4 && rowCount <= 9) {
            return 1 + (9 - rowCount) * 0.11;
        } else if (rowCount > 9) {
            return 1 - (rowCount - 9) * 0.07;
        }
        return 1;
    }

    // Mở toàn bộ đáp án
    // private openAllAnswer() {
    //     this.layoutTargetWord.children.forEach(layout => {
    //         layout.children.forEach(e => {
    //             if (e['keyCode']) {
    //                 const label = e.getChildByPath(`Label`).getComponent(Label);
    //                 if (label.string.trim() === "") {
    //                     label.string = e['keyCode'];
    //                 }
    //                 const btn = e.getComponent(Button);
    //                 if (btn) {
    //                     btn.destroy();
    //                 }
    //                 e.off(`click`);
    //             }
    //         });
    //     });
    // }


    //======================= BỘ VẬN HÀNH =========================//


    // Bộ đếm ngược
    private lastTimestamp: number = 0; // Biến lưu trữ thời điểm cập nhật cuối cùng (tính theo mili-giây)
    private gameTimer() {
        const now = Date.now();
        const deltaTime = (now - this.lastTimestamp) / 1000;

        this.lastTimestamp = now;

        // Giảm thời gian đếm ngược theo khoảng thời gian thực đã trôi qua
        this.numTime -= Math.floor(deltaTime);
        // Trừ điểm mỗi 5 giây
        // if (this.numTime % GameManager.timeStep === 0) {
        //     this.numScore += GameManager.timeScore;
        //     this.updateScoreLabel();
        // }

        if (this.numTime <= 0 || this.numScore <= 0) {
            // this.numScore = 0;
            this.numTime = 0;
            this.endGame();
        }

        this.updateTimeLabel();
    }

    startGame() {
        this.updateScoreLabel();
        this.updateTimeLabel();

        this.lastTimestamp = Date.now();

        this.schedule(this.gameTimer, 1);
    }

    // Kết thúc game
    private endGame() {
        AudioController.Instance.EndGame();
        this.unschedule(this.gameTimer);
        this.isGameover = true;
        // this.openAllAnswer();

        this.numScore = this.numScore + this.numTime * 2;
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

                // // Sự kiện BATTA
                // if (this.numScore >= 3000) {
                //     APIManager.Challenge(`wordPuzzle3kPoint`, this.numScore);
                // } else if (this.numScore >= 2000 && this.numScore < 3000) {
                //     APIManager.Challenge(`wordPuzzle2kPoint`, this.numScore);
                // } else if (this.numScore >= 1500) {
                //     APIManager.Challenge(`wordPuzzle1k5Point`, this.numScore);
                // }
            });
        }

        // console.log("data: ", JSON.stringify(data))
        console.log("Game kết thúc!");
    }

    // Thoát game
    outGame() {
        this.unschedule(this.gameTimer);
        this.isGameover = true;

        // Gửi điểm lên server
        console.log(">>>isDefault", this.isDefault)
        if (!this.isDefault) {
            let data = {
                "username": APIManager.userDATA?.username,
                "score": this.numScore,
                "time": this.numTime
            }
            // let data = {
            //     "username": APIManager.userDATA?.username,
            //     "score": 0,
            //     "time": 0
            // }
            APIManager.requestData(`POST`, `/api/saveScore`, data, res => {
                console.log("Thoát game => Gửi server:", res);
            });
        }
    }

    // Xử lý click vào gợi ý
    private handleLetterClick(letter: Node, char: string) {
        if (!this.isGameover) {
            if (this.onItem2) {
                KeyControl.Instance.clickBox();
                this.checkLetters(letter, char);
                this.onItem2 = false;
                this.stopAnimation(this.iconItem2);
                // AnimationController.Instance.moveHintLeftRight(`L`);
                this.numItemUse[1] -= 1;
                this.layoutAllLetters.forEach(layout => layout.children.forEach(child => this.stopAnimation(child)));
            } else {
                // AnimationController.Instance.playAnimationNomal(`Hand2`);
            }
        }
    }

    // Xử lý sự kiện khi nhấn vào từ
    private handleWordClick(charNode: Node, rowIndex: number): void {
        if (this.isGameover) return;

        this.questionRowLabel.string = `${rowIndex + 1}. ${this.gameData.questionRow[rowIndex]}`;

        if (this.onItem3) {
            charNode.off('click');
            charNode?.getComponent(Button).destroy();
            charNode.getChildByPath(`Label`).getComponent(Label).string = charNode['keyCode'];
            this.checkCompletedWord(charNode);
            this.numScore += GameManager.hintWord;
            this.updateScoreLabel(GameManager.hintWord, charNode);
            this.onItem3 = false;
            this.stopAnimation(this.iconItem3);
            // AnimationController.Instance.moveHintLeftRight(`L`);
            this.numItemUse[2] -= 1;
            this.layoutTargetWord.children.forEach(layout => {
                layout.children.forEach(child => this.stopAnimation(child));
            });
            return;
        }

        KeyControl.Instance.clickBox(charNode);
        this.moveKeyboard("up");
    }

    // Xử lý click vào âm thanh gợi ý
    private handleSoundHintClick(item: Node, word: string) {
        if (!this.isGameover) {
            this.onReadWord(word);
            if (this.wordReaded.indexOf(word) === -1) {
                this.wordReaded.push(word);
                this.numScore += GameManager.hintSound;
                this.updateScoreLabel(GameManager.hintSound, item);
                item.getComponent(Sprite).grayscale = false;
                item.parent = this.soundOn;
                this.onItem1 = false;
                this.stopAnimation(this.iconItem1);
                // AnimationController.Instance.moveHintLeftRight(`L`);
                this.numItemUse[0] -= 1;
            }
        }
    }

    // Kiểm tra từ giống với đáp án
    async checkLetters(letter: Node, txt: string) {
        if (!this.gameData.all_letter.includes(txt)) return;

        // Trừ điểm khi mở gợi ý
        this.numScore += GameManager.hintKey;
        this.updateScoreLabel(GameManager.hintKey, letter);

        // chuyển trạng thái gợi ý
        if (letter['keyCode'] === txt) {
            letter.getComponent(Box).chanceImage(0);
            letter.off(`click`);
            letter.getComponent(Button)?.destroy();
        }

        // chuyển trạng thái đáp án
        const moves: Array<{ start: Node, target: Node, txt: string }> = [];
        this.layoutTargetWord.children.forEach(layout => {
            layout.children.forEach(e => {
                if (e['keyCode'] === txt) {
                    // this.moveLetters(letter, e, txt);
                    moves.push({ start: letter, target: e, txt: txt });
                    e.off(`click`);
                    e.getComponent(Button)?.destroy();
                }
            });
        });

        // Chạy các hiệu ứng moveLetters tuần tự
        for (const move of moves) {
            await this.moveLetters(move.start, move.target, move.txt);
            await AudioController.Instance.OpenHint();
        }
    }

    // Từ sai với đáp án
    onWrongInput(target: Node) {
        this.numScore += GameManager.wrongKey;
        this.updateScoreLabel(GameManager.wrongKey, target);
        this.effectWrong(target);
        this.comboWords = 0;
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
            APIManager.Challenge(`wordPuzzleSub`, 1);
            // this.comboWords += 1;
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
                APIManager.Challenge(`wordPuzzleMain`, 1);
                // this.comboWords += 1;
            }
        }

        // Logic Challage Game
        // this.scheduleOnce(() => {
        //     if (bonus > 0 && APIManager.service === SERVICE_ASSETS.ELSA) {
        //         if (this.comboWords >= 1) {
        //             APIManager.Challenge('quizTrue', 1);
        //         }
        //         switch (this.comboWords) {
        //             case 3:
        //                 APIManager.Challenge('quizCombo3', 1);
        //                 break;
        //             case 5:
        //                 APIManager.Challenge('quizCombo5', 1);
        //                 break;
        //             case 7:
        //                 APIManager.Challenge('quizCombo7', 1);
        //                 break;
        //         }
        //     }
        // }, 0.01)


        this.numScore += bonus;
        this.updateScoreLabel(bonus, taget);
        // if (isBonus) {
        // }

        this.checkAllWords();
    }


    // Kiểm tra qua tất cả các chữ có trong đáp án nếu được mở hết
    private checkAllWords() {
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
                        e.getComponent(Button)?.destroy();
                        return true;
                    }
                    return false;
                });
            });
        }
    }

    // Dùng API Google để đọc text
    onReadWord(txt: string) {
        if (window.speechSynthesis) {
            const msg = new SpeechSynthesisUtterance(txt);
            msg.voice = speechSynthesis.getVoices()[6]; // Giọng đọc
            msg.lang = 'en-US'; // Ngôn ngữ tiếng Anh
            msg.volume = 1; // Âm lượng (0-1)
            msg.rate = 0.8; // Tốc độ đọc (0.1-10)
            msg.pitch = 1; // Độ cao giọng (0-2)
            window.speechSynthesis.speak(msg);
        } else {
            console.error("SpeechSynthesis không được hỗ trợ trên nền tảng này!");
        }
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
        if (parent.children[index + 1].getChildByPath(`Label`).getComponent(Label).string.trim()) return null;

        return parent.children[index + 1];
    }



    //======================= BỘ HIỆU ỨNG =========================//

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
        this.numScore = Math.max(0, this.numScore);
        this.scoreLabel.string = `${this.numScore}`;
        if (bonus) this.showBonusEffect(bonus, targetNode);
    }

    // Hiệu ứng cộng điểm
    private showBonusEffect(bonus: number, target: Node) {
        // Cache node vị trí ban đầu
        const OFFSET_Y = 60;
        const startPos = target ? target.getWorldPosition().clone() : this.scoreLabel.node.getWorldPosition().clone();

        // Tính toán vị trí khởi tạo và vị trí mục tiêu dựa theo bonus
        const initPos = bonus >= 0 ? startPos.clone().add(v3(0, -OFFSET_Y, 0)) : startPos.clone();
        const targetPos = startPos.clone().add(v3(0, bonus >= 0 ? 0 : -OFFSET_Y, 0));


        // Tạo node bonus và gán parent
        const bonusNode = new Node("BonusEffect");
        bonusNode.parent = this.mapNode;
        bonusNode.setWorldPosition(initPos);

        // Tạo Label cho node bonus
        const bonusLabel = bonusNode.addComponent(Label);
        bonusLabel.string = bonus >= 0 ? `+${bonus}` : `${bonus}`;
        bonusLabel.color = bonus >= 0 ? new Color(0, 255, 0) : new Color(255, 0, 0);
        bonusLabel.fontSize = 40;
        bonusLabel.lineHeight = 50;
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

    // Di chuyển bàn phím ảo khi cần
    private moveKeyboard(active: string) {
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

    // tắt trợ giúp
    private moveHint() {
        // KeyControl.Instance.clickBox();
        // AnimationController.Instance.moveHintLeftRight(`L`);
    }

    // Effect di chuyển đáp án
    private moveLetters(start: Node, target: Node, txt: string): Promise<void> {
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
                label.color = new Color(0, 0, 0);
            })
            .start();
    }

    //Chạy các hiệu ứng trong edit
    private playAnimation(node: Node): void {
        const anim = node.getComponent(Animation);
        if (anim) {
            anim.play();
        }
    }
    private stopAnimation(child: Node): void {
        const anim = child.getComponent(Animation);
        if (anim) {
            anim.stop();

        }
        // child.eulerAngles = new Vec3(0, 0, 0);
        child.setScale(new Vec3(1, 1, 1));
        child.rotation = Quat.IDENTITY;
        const sprite = child.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(255, 255, 255, 255);
        }
    }


    //Bật tắt các Item
    clickOnOff(e: Event, type: string) {
        KeyControl.Instance.confirmBox(false);
        this.OffAllItem();
        switch (type) {
            case "item1":
                if (this.numItemUse[0] > 0) {
                    this.onItem1 = !this.onItem1;
                    if (this.onItem1) {
                        this.playAnimation(this.iconItem1);
                        // AnimationController.Instance.playAnimation(`Sound`);
                    } else {
                        this.stopAnimation(this.iconItem1);
                        // AnimationController.Instance.moveHintLeftRight(`L`);
                    }
                }
                break;
            case "item2":
                if (this.numItemUse[1] > 0) {
                    this.onItem2 = !this.onItem2;
                    if (this.onItem2) {
                        this.playAnimation(this.iconItem2);
                        // AnimationController.Instance.playAnimation(`Letter`);
                        this.layoutAllLetters.forEach(layout => {
                            layout.children.forEach(child => {
                                this.playAnimation(child);
                            });
                        });
                    }
                    else {
                        this.stopAnimation(this.iconItem2);
                        // AnimationController.Instance.moveHintLeftRight(`L`);
                        this.layoutAllLetters.forEach(layout => {
                            layout.children.forEach(child => {
                                this.stopAnimation(child);
                            });
                        });
                    }
                }
                break;
            case "item3":
                if (this.numItemUse[2] > 0) {
                    this.onItem3 = !this.onItem3;
                    if (this.onItem3) {
                        this.playAnimation(this.iconItem3);
                        // AnimationController.Instance.playAnimation(`Words`);
                        this.layoutTargetWord.children.forEach(layout => {
                            layout.children.forEach(child => {
                                this.playAnimation(child);
                            });
                        });
                    } else {
                        this.stopAnimation(this.iconItem3);
                        // AnimationController.Instance.moveHintLeftRight(`L`);
                        this.layoutTargetWord.children.forEach(layout => {
                            layout.children.forEach(child => {
                                this.stopAnimation(child);
                            });
                        });
                    }
                }
                break;
        }
    }

}


