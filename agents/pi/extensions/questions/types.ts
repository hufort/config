export interface Question {
	question: string;
	context?: string;
	recommendation?: string;
}

export interface QuestionAnswer {
	question: string;
	answer: string;
}

export interface ExtractionResult {
	questions: Question[];
}
