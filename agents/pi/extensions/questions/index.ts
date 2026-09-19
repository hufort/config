import { BorderedLoader, type ExtensionAPI, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { extractQuestions, selectExtractionModel } from "./extract-questions.js";
import { formatAnswers, showQuestions } from "./question-ui.js";
import type { Question } from "./types.js";

function findLastAssistantText(ctx: ExtensionContext): string | undefined {
	const branch = ctx.sessionManager.getBranch();
	for (let index = branch.length - 1; index >= 0; index--) {
		const entry = branch[index];
		if (entry.type !== "message") continue;
		const message = entry.message;
		if (!("role" in message) || message.role !== "assistant") continue;
		if (message.stopReason !== "stop") {
			throw new Error(`Last assistant message incomplete (${message.stopReason})`);
		}
		const text = message.content
			.filter((content): content is { type: "text"; text: string } => content.type === "text")
			.map((content) => content.text)
			.join("\n");
		if (text) return text;
	}
	return undefined;
}

export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "ask_questions",
		label: "Ask Questions",
		description:
			"Present a batch of structured questions in an interactive form and return the user's answers. Use for questions that can be answered concurrently. Recommendations are suggestions, not answers.",
		promptSnippet: "Present multiple structured questions in an interactive form",
		parameters: Type.Object({
			questions: Type.Array(
				Type.Object({
					question: Type.String({ description: "The decision or information requested from the user" }),
					context: Type.Optional(Type.String({ description: "Essential context needed to answer" })),
					recommendation: Type.Optional(Type.String({ description: "The assistant's recommended answer and rationale" })),
				}),
				{ minItems: 1 },
			),
		}),
		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const answers = await showQuestions(ctx, params.questions as Question[]);
			if (answers === null) {
				return {
					content: [{ type: "text", text: "The user cancelled the question form without submitting answers." }],
					details: { cancelled: true, answers: [] },
				};
			}
			return {
				content: [{ type: "text", text: `The user answered:\n\n${formatAnswers(answers)}` }],
				details: { cancelled: false, answers },
			};
		},
	});

	const answerHandler = async (ctx: ExtensionContext) => {
		if (ctx.mode !== "tui") {
			ctx.ui.notify("answer requires interactive TUI mode", "error");
			return;
		}
		if (!ctx.model) {
			ctx.ui.notify("No model selected", "error");
			return;
		}

		let lastAssistantText: string | undefined;
		try {
			lastAssistantText = findLastAssistantText(ctx);
		} catch (error) {
			ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
			return;
		}
		if (!lastAssistantText) {
			ctx.ui.notify("No assistant messages found", "error");
			return;
		}

		const extractionModel = await selectExtractionModel(ctx.model, ctx.modelRegistry);
		const extraction = await ctx.ui.custom<Awaited<ReturnType<typeof extractQuestions>> | null>(
			(tui, theme, _keybindings, done) => {
				const loader = new BorderedLoader(tui, theme, `Extracting questions using ${extractionModel.id}...`);
				loader.onAbort = () => done(null);
				extractQuestions(lastAssistantText!, extractionModel, ctx.modelRegistry, loader.signal)
					.then(done)
					.catch((error) => {
						ctx.ui.notify(`Question extraction failed: ${error instanceof Error ? error.message : String(error)}`, "error");
						done(null);
					});
				return loader;
			},
		);

		if (extraction === null) {
			ctx.ui.notify("Question extraction did not complete", "info");
			return;
		}
		if (extraction.result === null) {
			ctx.ui.notify(
				`Question extraction returned invalid JSON: stopReason=${extraction.stopReason}${extraction.errorMessage ? ` error=${extraction.errorMessage}` : ""} text=${extraction.rawText.slice(0, 500)}`,
				"error",
			);
			return;
		}
		if (extraction.result.questions.length === 0) {
			ctx.ui.notify("No questions found in the last message", "info");
			return;
		}

		const answers = await showQuestions(ctx, extraction.result.questions);
		if (answers === null) {
			ctx.ui.notify("Cancelled", "info");
			return;
		}
		pi.sendMessage(
			{
				customType: "answers",
				content: `I answered your questions in the following way:\n\n${formatAnswers(answers)}`,
				display: true,
			},
			{ triggerTurn: true },
		);
	};

	pi.registerCommand("answer", {
		description: "Extract questions from the last assistant message into interactive Q&A",
		handler: (_args, ctx) => answerHandler(ctx),
	});
	pi.registerShortcut("ctrl+.", {
		description: "Extract and answer questions",
		handler: answerHandler,
	});
}
