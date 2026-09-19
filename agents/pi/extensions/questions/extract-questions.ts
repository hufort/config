import { complete, type Api, type Model, type UserMessage } from "@earendil-works/pi-ai";
import type { ModelRegistry } from "@earendil-works/pi-coding-agent";
import type { ExtractionResult, Question } from "./types.js";

const SYSTEM_PROMPT = `You are a question extractor. Given text from a conversation, extract any questions that still require user input.

Output a JSON object with this structure:
{
  "questions": [
    {
      "question": "The question text",
      "context": "Optional context that helps answer the question",
      "recommendation": "Optional answer recommended by the assistant"
    }
  ]
}

Rules:
- Extract all questions that require user input
- Keep questions in the order they appeared
- Keep question text concise
- Include context only when it provides essential information for answering
- A recommendation, suggested default, or line beginning with ➡️ is not the user's answer; capture it as recommendation and still extract the question
- If no questions are found, return {"questions": []}`;

const CODEX_MODEL_IDS = ["gpt-5.2", "gpt-5.3", "gpt-5.5"];

export async function selectExtractionModel(
	currentModel: Model<Api>,
	modelRegistry: ModelRegistry,
): Promise<Model<Api>> {
	for (const modelId of CODEX_MODEL_IDS) {
		const codexModel = modelRegistry.find("openai-codex", modelId);
		if (codexModel) {
			const auth = await modelRegistry.getApiKeyAndHeaders(codexModel);
			if (auth.ok) return codexModel;
		}
	}
	return currentModel;
}

export function parseExtractionResult(text: string): ExtractionResult | null {
	try {
		let jsonStr = text;
		const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
		if (jsonMatch) jsonStr = jsonMatch[1].trim();

		const parsed = JSON.parse(jsonStr);
		if (!parsed || !Array.isArray(parsed.questions)) return null;

		const questions = parsed.questions
			.filter((value: unknown): value is Question => {
				if (!value || typeof value !== "object") return false;
				const question = value as Record<string, unknown>;
				return (
					typeof question.question === "string" &&
					question.question.trim().length > 0 &&
					(question.context === undefined || typeof question.context === "string") &&
					(question.recommendation === undefined || typeof question.recommendation === "string")
				);
			})
			.map((question) => ({
				question: question.question.trim(),
				...(question.context?.trim() ? { context: question.context.trim() } : {}),
				...(question.recommendation?.trim() ? { recommendation: question.recommendation.trim() } : {}),
			}));
		return { questions };
	} catch {
		return null;
	}
}

export async function extractQuestions(
	text: string,
	model: Model<Api>,
	modelRegistry: ModelRegistry,
	signal?: AbortSignal,
): Promise<{ result: ExtractionResult | null; rawText: string; stopReason: string; errorMessage?: string }> {
	const auth = await modelRegistry.getApiKeyAndHeaders(model);
	if (!auth.ok) throw new Error(auth.error);

	const userMessage: UserMessage = {
		role: "user",
		content: [{ type: "text", text }],
		timestamp: Date.now(),
	};
	const authorization = auth.headers?.Authorization ?? auth.headers?.authorization;
	const authToken =
		typeof authorization === "string" && authorization.startsWith("Bearer ")
			? authorization.slice("Bearer ".length)
			: undefined;
	const response = await complete(
		model,
		{ systemPrompt: SYSTEM_PROMPT, messages: [userMessage] },
		{ apiKey: auth.apiKey, authToken, headers: auth.headers, signal },
	);
	const rawText = response.content
		.filter((content): content is { type: "text"; text: string } => content.type === "text")
		.map((content) => content.text)
		.join("\n");

	return {
		result: response.stopReason === "aborted" ? null : parseExtractionResult(rawText),
		rawText,
		stopReason: response.stopReason,
		...(response.errorMessage ? { errorMessage: response.errorMessage } : {}),
	};
}
