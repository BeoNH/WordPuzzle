import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    // data mẫu
    public static data = {
        all_letter: ['H', 'O', 'U', 'S', 'E', 'P', 'A', 'R', 'L', 'G', 'M', 'T', 'N'], // mảng string
        question: "Từ dưới nói về 1 bộ phận",
        answer: [
            [' ', ' ', ' ', 'H', 'O', 'U', 'S', 'E', ' '],
            [' ', ' ', 'P', 'E', 'A', 'R', 'L', ' ', ' '],
            [' ', ' ', 'G', 'A', 'M', 'E', ' ', ' ', ' '],
            ['S', 'M', 'A', 'R', 'T', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', 'T', 'H', 'R', 'O', 'N', 'E']
        ],
        keyAnswer: 3, // cột thứ 4 là khoá chính
        countdown: 180, // thời gian đếm ngược
    }
}


