import { _decorator, Button, Color, Component, EventHandle, EventHandler, instantiate, Label, Layout, Node, Prefab, Sprite } from 'cc';
import { GameManager } from './GameManager';
import { KeyControl } from './KeyControl';
const { ccclass, property } = _decorator;

@ccclass('WordPuzzle')
export class WordPuzzle extends Component {

    @property({ type: Node, tooltip: "Tất cả chữ cái để tìm" })
    protected layoutAllLetters: Node[] = [];

    @property({ type: Node, tooltip: "Ma trận từ cần tìm" })
    protected layoutTargetWord: Node = null;

    @property({ type: Prefab, tooltip: "Hộp chứa từ" })
    protected targetBox: Prefab = null;

    onLoad(): void {
        this.generateAllLetter();
        this.generateMatrix();
    }

    start() {

    }

    update(deltaTime: number) {

    }

    //Khởi tạo lại game
    resetGame() {
        this.layoutTargetWord.removeAllChildren();
        this.layoutAllLetters.forEach(e => { e.removeAllChildren(); e.active = false });
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
            letter[`keyCode`] = item;

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
                    charNode.off(`click`);
                    charNode.on(`click`, () => {
                        KeyControl.Instance.clickBox(charNode);
                    });
                } else {
                    bgNode.active = false;
                }
            }
        }
    }

    private initTargetBox() {

    }
}


