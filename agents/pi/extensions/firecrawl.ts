import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import Firecrawl from "@mendable/firecrawl-js";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { StringEnum } from "@earendil-works/pi-ai";
import { Type } from "typebox";

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_CONTENT_CHARS = 12_000;
const MAX_CONTENT_CHARS = 60_000;
const MAX_SEARCH_SCRAPES = 5;

function readEnvValue(name: string): string | undefined {
	if (process.env[name]) return process.env[name];

	const envPath = join(homedir(), ".pi", "agent", ".env");
	let envText = "";

	try {
		envText = readFileSync(envPath, "utf8");
	} catch {
		return undefined;
	}

	for (const line of envText.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;

		const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
		if (!match || match[1] !== name) continue;

		const value = match[2].trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			return value.slice(1, -1);
		}

		return value.replace(/\s+#.*$/, "");
	}

	return undefined;
}

function createClient() {
	const apiKey = readEnvValue("FIRECRAWL_API_KEY");
	if (!apiKey) {
		throw new Error("Missing FIRECRAWL_API_KEY in environment or ~/.pi/agent/.env");
	}

	return new Firecrawl({ apiKey });
}

function asErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : String(error);
}

function clampInteger(value: unknown, fallback: number, min: number, max: number) {
	const parsed = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(parsed)) return fallback;
	return Math.max(min, Math.min(max, Math.floor(parsed)));
}

function assertHttpUrl(url: string) {
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		throw new Error(`Invalid URL: ${url}`);
	}
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		throw new Error(`Only http(s) URLs are supported: ${url}`);
	}
}

function truncateText(text: string, maxChars: number) {
	if (text.length <= maxChars) return text;
	return `${text.slice(0, maxChars).trimEnd()}\n\n[Truncated ${text.length - maxChars} characters]`;
}

function stringifyDetails(value: unknown) {
	return JSON.stringify(value, null, 2);
}

function resultArray(result: unknown): Array<Record<string, unknown>> {
	if (Array.isArray(result)) return result.filter((item): item is Record<string, unknown> => !!item && typeof item === "object");
	if (result && typeof result === "object") {
		const obj = result as Record<string, unknown>;
		for (const key of ["data", "results", "web", "news", "images"]) {
			if (Array.isArray(obj[key])) {
				return obj[key].filter((item): item is Record<string, unknown> => !!item && typeof item === "object");
			}
		}
	}
	return [];
}

function textField(item: Record<string, unknown>, keys: string[]) {
	for (const key of keys) {
		const value = item[key];
		if (typeof value === "string" && value.trim()) return value.trim();
	}
	return undefined;
}

function formatSearchResult(result: unknown, maxContentChars: number) {
	const results = resultArray(result);
	if (results.length === 0) {
		return `No normalized results found. Raw response:\n${truncateText(stringifyDetails(result), maxContentChars)}`;
	}

	return results
		.map((item, index) => {
			const title = textField(item, ["title", "name"]) ?? "Untitled";
			const url = textField(item, ["url", "link", "sourceURL", "sourceUrl"]) ?? "No URL returned";
			const description = textField(item, ["description", "snippet", "summary", "content"]);
			const markdown = textField(item, ["markdown"]);
			const parts = [`${index + 1}. ${title}`, `   URL: ${url}`];
			if (description) parts.push(`   Summary: ${truncateText(description, 1_000)}`);
			if (markdown) parts.push(`\n   Markdown excerpt:\n${truncateText(markdown, maxContentChars)}`);
			return parts.join("\n");
		})
		.join("\n\n");
}

export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "firecrawl_search",
		label: "Firecrawl Search",
		description: "Search the web with Firecrawl. Returns web/news/image results, and can optionally include bounded markdown content for top web results.",
		promptSnippet: "Search the web with Firecrawl for current information and source URLs.",
		promptGuidelines: [
			"Use firecrawl_search when the user asks for current web information, source discovery, or information beyond the local workspace.",
			"Use firecrawl_scrape after firecrawl_search when you need full readable markdown from a specific result URL.",
			"Keep firecrawl_search scrapeResults=false unless snippets are insufficient or the user asks for a deeper web read.",
		],
		parameters: Type.Object({
			query: Type.String({ description: "The web search query." }),
			limit: Type.Optional(Type.Integer({ description: "Maximum number of results to return. Defaults to 5.", minimum: 1, maximum: MAX_LIMIT })),
			source: Type.Optional(StringEnum(["web", "news", "images"] as const)),
			scrapeResults: Type.Optional(Type.Boolean({ description: "Whether to scrape result pages and include bounded markdown. Defaults to false." })),
			maxContentChars: Type.Optional(Type.Integer({ description: "Maximum markdown characters to expose per result. Defaults to 12000.", minimum: 1, maximum: MAX_CONTENT_CHARS })),
		}),
		async execute(_toolCallId, params, signal, onUpdate) {
			try {
				const limit = clampInteger(params.limit, DEFAULT_LIMIT, 1, MAX_LIMIT);
				const maxContentChars = clampInteger(params.maxContentChars, DEFAULT_MAX_CONTENT_CHARS, 1, MAX_CONTENT_CHARS);
				const effectiveLimit = params.scrapeResults ? Math.min(limit, MAX_SEARCH_SCRAPES) : limit;

				onUpdate?.({ content: [{ type: "text", text: `Searching Firecrawl for: ${params.query}` }] });

				const client = createClient();
				const result = await client.search(params.query, {
					limit: effectiveLimit,
					sources: [params.source ?? "web"],
					scrapeOptions: params.scrapeResults ? { formats: ["markdown"], timeout: DEFAULT_TIMEOUT_MS } : undefined,
					timeout: DEFAULT_TIMEOUT_MS,
				});

				if (signal?.aborted) throw new Error("Search cancelled");

				return {
					content: [{ type: "text", text: formatSearchResult(result, maxContentChars) }],
					details: result,
				};
			} catch (error) {
				return {
					content: [{ type: "text", text: `Firecrawl search failed: ${asErrorMessage(error)}` }],
					details: { error: asErrorMessage(error) },
					isError: true,
				};
			}
		},
	});

	pi.registerTool({
		name: "firecrawl_scrape",
		label: "Firecrawl Scrape",
		description: "Fetch a single URL with Firecrawl and return cleaned, bounded markdown suitable for agent context.",
		promptSnippet: "Fetch a URL's page content as cleaned markdown with Firecrawl.",
		promptGuidelines: [
			"Use firecrawl_scrape when you need full readable markdown content from a known URL.",
			"Prefer firecrawl_scrape over bash/fetch for web pages because firecrawl_scrape returns cleaned markdown suitable for agent context.",
		],
		parameters: Type.Object({
			url: Type.String({ description: "The http(s) URL to fetch." }),
			onlyMainContent: Type.Optional(Type.Boolean({ description: "Only return the main page content. Defaults to true." })),
			waitFor: Type.Optional(Type.Integer({ description: "Milliseconds to wait before capturing content, useful for JS-heavy pages.", minimum: 0 })),
			timeout: Type.Optional(Type.Integer({ description: "Request timeout in milliseconds. Defaults to 30000.", minimum: 1000 })),
			maxContentChars: Type.Optional(Type.Integer({ description: "Maximum markdown characters to expose. Defaults to 12000.", minimum: 1, maximum: MAX_CONTENT_CHARS })),
			includeMetadata: Type.Optional(Type.Boolean({ description: "Append page metadata to the markdown output. Defaults to false. Full metadata is always available in details." })),
		}),
		async execute(_toolCallId, params, signal, onUpdate) {
			try {
				assertHttpUrl(params.url);
				const timeout = clampInteger(params.timeout, DEFAULT_TIMEOUT_MS, 1000, 120_000);
				const maxContentChars = clampInteger(params.maxContentChars, DEFAULT_MAX_CONTENT_CHARS, 1, MAX_CONTENT_CHARS);

				onUpdate?.({ content: [{ type: "text", text: `Scraping page with Firecrawl: ${params.url}` }] });

				const client = createClient();
				const document = await client.scrape(params.url, {
					formats: ["markdown"],
					onlyMainContent: params.onlyMainContent ?? true,
					waitFor: params.waitFor,
					timeout,
				});

				if (signal?.aborted) throw new Error("Scrape cancelled");

				const metadata = params.includeMetadata && document.metadata ? `\n\nMetadata:\n${stringifyDetails(document.metadata)}` : "";
				const markdown = document.markdown?.trim() || "No markdown content returned.";

				return {
					content: [{ type: "text", text: `${truncateText(markdown, maxContentChars)}${metadata}` }],
					details: document,
				};
			} catch (error) {
				return {
					content: [{ type: "text", text: `Firecrawl scrape failed: ${asErrorMessage(error)}` }],
					details: { error: asErrorMessage(error) },
					isError: true,
				};
			}
		},
	});
}
