import { _decorator, Component, Layout, Node, Prefab } from 'cc';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('WordPuzzle')
export class WordPuzzle extends Component {

    @property({ type: Node, tooltip: "Tất cả chữ cái để tìm" })
    protected layoutAllLetters: Node = null;

    @property({ type: Node, tooltip: "Ma trận từ cần tìm" })
    protected layoutTargetWord: Node = null;

    @property({ type: Prefab, tooltip: "Hộp chứa từ" })
    protected targetBox: Prefab = null;

    onLoad(): void {
        this.generateMatrix();
    }

    start() {

    }

    update(deltaTime: number) {

    }

    // Tạo mảng 2 chiều đáp án
    private generateMatrix(){
        console.log(GameManager.data.answer);
        for (let i = 0; i < GameManager.data.answer.length; i++) {
            let itemRow = GameManager.data.answer[i];
            let row = new Node(`${i}`);
            row.parent = this.layoutTargetWord;
            let layout = row.addComponent(Layout);
            
        }
    }
}


