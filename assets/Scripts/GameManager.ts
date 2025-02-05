import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    // data mẫu
    public static data = {
        all_letter: 'HOPARLUSGMETN', // mảng string
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
        max_score: 1000, // Điểm tối đa
    }

    // Thông số trong game
    public static readonly primaryKey = 500; // Mở từ chính
    public static readonly psecondaryKey = 300; // Mở từ phụ
    public static readonly wrongKey = -50; // Sai từ
    public static readonly hintKey = -100; // Gợi ý từ
    public static readonly timeScore = -10; // Đếm ngược
    public static readonly timeStep = 5; // Số s mỗi lần trừ điểm
}


