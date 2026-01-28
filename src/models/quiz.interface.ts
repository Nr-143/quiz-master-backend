export interface IOption {
    id: string;
    text: string;
    code?: string;
}

export interface IQuestion {
    id: string;
    question: string;
    options: IOption[];
    correctOptionId: string;
    explanation: string;
    hint?: string;
    difficulty?: string;
    tags?: string[];
}

export interface IQuiz {
    category: string;
    level: string;
    questions: IQuestion[];
}
