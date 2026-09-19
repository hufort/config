import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import {
	type Component,
	Editor,
	type EditorTheme,
	Key,
	matchesKey,
	truncateToWidth,
	type TUI,
	visibleWidth,
	wrapTextWithAnsi,
} from "@earendil-works/pi-tui";
import type { Question, QuestionAnswer } from "./types.js";

class QnAComponent implements Component {
	private readonly answers: string[];
	private currentIndex = 0;
	private readonly editor: Editor;
	private showingConfirmation = false;
	private cachedWidth?: number;
	private cachedLines?: string[];

	private readonly dim = (text: string) => `\x1b[2m${text}\x1b[0m`;
	private readonly bold = (text: string) => `\x1b[1m${text}\x1b[0m`;
	private readonly cyan = (text: string) => `\x1b[36m${text}\x1b[0m`;
	private readonly green = (text: string) => `\x1b[32m${text}\x1b[0m`;
	private readonly yellow = (text: string) => `\x1b[33m${text}\x1b[0m`;
	private readonly gray = (text: string) => `\x1b[90m${text}\x1b[0m`;

	constructor(
		private readonly questions: Question[],
		private readonly tui: TUI,
		private readonly onDone: (result: QuestionAnswer[] | null) => void,
	) {
		this.answers = questions.map(() => "");
		const editorTheme: EditorTheme = {
			borderColor: this.dim,
			selectList: {
				selectedPrefix: this.cyan,
				selectedText: (text) => `\x1b[44m${text}\x1b[0m`,
				description: this.gray,
				scrollInfo: this.dim,
				noMatch: this.yellow,
			},
		};
		this.editor = new Editor(tui, editorTheme);
		this.editor.disableSubmit = true;
		this.editor.onChange = () => {
			this.invalidate();
			this.tui.requestRender();
		};
	}

	private saveCurrentAnswer(): void {
		this.answers[this.currentIndex] = this.editor.getText();
	}

	private navigateTo(index: number): void {
		if (index < 0 || index >= this.questions.length) return;
		this.saveCurrentAnswer();
		this.currentIndex = index;
		this.editor.setText(this.answers[index] || "");
		this.invalidate();
	}

	private submit(): void {
		this.saveCurrentAnswer();
		this.onDone(
			this.questions.map((question, index) => ({
				question: question.question,
				answer: this.answers[index]?.trim() || "(no answer)",
			})),
		);
	}

	invalidate(): void {
		this.cachedWidth = undefined;
		this.cachedLines = undefined;
	}

	handleInput(data: string): void {
		if (this.showingConfirmation) {
			if (matchesKey(data, Key.enter) || data.toLowerCase() === "y") this.submit();
			else if (matchesKey(data, Key.escape) || matchesKey(data, Key.ctrl("c")) || data.toLowerCase() === "n") {
				this.showingConfirmation = false;
				this.invalidate();
				this.tui.requestRender();
			}
			return;
		}

		if (matchesKey(data, Key.escape) || matchesKey(data, Key.ctrl("c"))) {
			this.onDone(null);
			return;
		}
		if (matchesKey(data, Key.tab)) {
			if (this.currentIndex < this.questions.length - 1) this.navigateTo(this.currentIndex + 1);
			this.tui.requestRender();
			return;
		}
		if (matchesKey(data, Key.shift("tab"))) {
			if (this.currentIndex > 0) this.navigateTo(this.currentIndex - 1);
			this.tui.requestRender();
			return;
		}
		if (matchesKey(data, Key.up) && this.editor.getText() === "" && this.currentIndex > 0) {
			this.navigateTo(this.currentIndex - 1);
			this.tui.requestRender();
			return;
		}
		if (matchesKey(data, Key.down) && this.editor.getText() === "" && this.currentIndex < this.questions.length - 1) {
			this.navigateTo(this.currentIndex + 1);
			this.tui.requestRender();
			return;
		}
		if (matchesKey(data, Key.enter) && !matchesKey(data, Key.shift("enter"))) {
			this.saveCurrentAnswer();
			if (this.currentIndex < this.questions.length - 1) this.navigateTo(this.currentIndex + 1);
			else this.showingConfirmation = true;
			this.invalidate();
			this.tui.requestRender();
			return;
		}

		this.editor.handleInput(data);
		this.invalidate();
		this.tui.requestRender();
	}

	render(width: number): string[] {
		if (this.cachedLines && this.cachedWidth === width) return this.cachedLines;

		const lines: string[] = [];
		const boxWidth = Math.min(width - 4, 120);
		const contentWidth = boxWidth - 4;
		const horizontalLine = (count: number) => "─".repeat(count);
		const boxLine = (content: string, leftPad = 2): string => {
			const paddedContent = " ".repeat(leftPad) + content;
			const rightPad = Math.max(0, boxWidth - visibleWidth(paddedContent) - 2);
			return this.dim("│") + paddedContent + " ".repeat(rightPad) + this.dim("│");
		};
		const emptyBoxLine = () => this.dim("│") + " ".repeat(boxWidth - 2) + this.dim("│");
		const padToWidth = (line: string) => line + " ".repeat(Math.max(0, width - visibleWidth(line)));

		lines.push(padToWidth(this.dim("╭" + horizontalLine(boxWidth - 2) + "╮")));
		lines.push(padToWidth(boxLine(`${this.bold(this.cyan("Questions"))} ${this.dim(`(${this.currentIndex + 1}/${this.questions.length})`)}`)));
		lines.push(padToWidth(this.dim("├" + horizontalLine(boxWidth - 2) + "┤")));
		lines.push(
			padToWidth(
				boxLine(
					this.questions
						.map((_, index) =>
							index === this.currentIndex ? this.cyan("●") : this.answers[index]?.trim() ? this.green("●") : this.dim("○"),
						)
						.join(" "),
				),
			),
		);
		lines.push(padToWidth(emptyBoxLine()));

		const question = this.questions[this.currentIndex];
		for (const line of wrapTextWithAnsi(`${this.bold("Q:")} ${question.question}`, contentWidth)) {
			lines.push(padToWidth(boxLine(line)));
		}
		if (question.context) {
			lines.push(padToWidth(emptyBoxLine()));
			for (const line of wrapTextWithAnsi(this.gray(`> ${question.context}`), contentWidth - 2)) {
				lines.push(padToWidth(boxLine(line)));
			}
		}
		if (question.recommendation) {
			lines.push(padToWidth(emptyBoxLine()));
			for (const line of wrapTextWithAnsi(this.green(`➡ ${question.recommendation}`), contentWidth - 2)) {
				lines.push(padToWidth(boxLine(line)));
			}
		}

		lines.push(padToWidth(emptyBoxLine()));
		const answerPrefix = this.bold("A: ");
		const editorLines = this.editor.render(contentWidth - 7);
		for (let index = 1; index < editorLines.length - 1; index++) {
			lines.push(padToWidth(boxLine(index === 1 ? answerPrefix + editorLines[index] : "   " + editorLines[index])));
		}
		lines.push(padToWidth(emptyBoxLine()));
		lines.push(padToWidth(this.dim("├" + horizontalLine(boxWidth - 2) + "┤")));
		const footer = this.showingConfirmation
			? `${this.yellow("Submit all answers?")} ${this.dim("(Enter/y to confirm, Esc/n to cancel)")}`
			: `${this.dim("Tab/Enter")} next · ${this.dim("Shift+Tab")} prev · ${this.dim("Shift+Enter")} newline · ${this.dim("Esc")} cancel`;
		lines.push(padToWidth(boxLine(truncateToWidth(footer, contentWidth))));
		lines.push(padToWidth(this.dim("╰" + horizontalLine(boxWidth - 2) + "╯")));

		this.cachedWidth = width;
		this.cachedLines = lines;
		return lines;
	}
}

export async function showQuestions(
	ctx: ExtensionContext,
	questions: Question[],
): Promise<QuestionAnswer[] | null> {
	if (ctx.mode !== "tui") throw new Error("Interactive questions require Pi's TUI mode");
	if (questions.length === 0) return [];
	return ctx.ui.custom<QuestionAnswer[] | null>((tui, _theme, _keybindings, done) =>
		new QnAComponent(questions, tui, done),
	);
}

export function formatAnswers(answers: QuestionAnswer[]): string {
	return answers.flatMap(({ question, answer }) => [`Q: ${question}`, `A: ${answer}`, ""]).join("\n").trim();
}
