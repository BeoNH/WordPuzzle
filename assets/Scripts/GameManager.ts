import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    // data mẫu
    public static data = {
        all_letter: 'HOPARLUSGMETN', // mảng string
        question: "ĐÂY LÀ DATA TEST",
        questionRow: [`Câu hỏi 1?`, `Câu hỏi 2?`, `Câu hỏi 3?`, `Câu hỏi 4?`, `Câu hỏi 5?`], // Mảng câu hỏi theo hàng
        answer: [
            [' ', ' ', ' ', ' ', 'H', 'O', 'U', 'S', 'E', ' '],
            [' ', ' ', ' ', 'P', 'E', 'A', 'R', 'L', ' ', ' '],
            [' ', ' ', ' ', 'G', 'A', 'M', 'E', ' ', ' ', ' '],
            [' ', 'S', 'M', 'A', 'R', 'T', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', 'T', 'H', 'R', 'O', 'N', 'E']
        ],
        keyAnswer: 4, // cột thứ 5 là khoá chính
        countdown: 300, // thời gian đếm ngược
        max_score: 1000, // Điểm tối đa
    }

    // Thông số trong game
    public static readonly primaryKey = 500; // Mở từ chính
    public static readonly psecondaryKey = 300; // Mở từ phụ
    public static readonly wrongKey = -50; // Sai từ
    public static readonly hintKey = -200; // Gợi ý từ
    public static readonly hintWord = -100; // Gợi ý chữ
    public static readonly hintSound = -100; // Gợi ý từ
    public static readonly timeScore = -2; // Đếm ngược
    public static readonly timeStep = 1; // Số s mỗi lần trừ điểm
    public static readonly itemCount = [2, 2, 2]; // Số lần dừng Item
}


