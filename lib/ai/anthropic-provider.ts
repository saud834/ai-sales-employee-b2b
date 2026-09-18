import Anthropic from "@anthropic-ai/sdk";
import type { WebsiteSpec } from "@/lib/types";
import type { AIProvider, ModifyResult, WebsiteBrief } from "@/lib/ai/provider";
import { AIProviderError } from "@/lib/ai/provider";
import { componentTypes, websiteSpecSchema } from "@/lib/schema";

const SYSTEM_PROMPT = `You are the planning engine of an AI website builder for a B2B sales tool.
Given a natural-language brief (and optionally structured lead context), you output a single
JSON object matching the WebsiteSpec shape below. You NEVER output prose, markdown fences, or
explanation — only the raw JSON object.

WebsiteSpec shape:
{
  "meta": { "siteName", "tagline", "websiteType", "industry", "targetAudience",
            "brandPersonality": string[], "ctaStrategy", "language": "ar"|"en",
            "direction": "ltr"|"rtl", "whatsapp"?, "phone"?, "email"?, "address"? },
  "theme": { "mode": "light"|"dark", "primaryColor", "secondaryColor", "accentColor",
             "surfaceColor", "inkColor" (all hex colors), "fontHeading", "fontBody",
             "radius": "none"|"sm"|"md"|"lg"|"xl", "density": "compact"|"comfortable"|"spacious" },
  "nav": [{ "label", "href" }],
  "pages": [{ "id", "slug" (kebab-case), "name", "seo": { "title", "description", "keywords": string[] },
              "sections": [{ "id", "type", "props": {...} }] }],
  "assets": []
}

Only use these section "type" values, each with the props shape implied by its name:
${componentTypes.join(", ")}

Rules:
- Compose the site ONLY from these component types. Do not invent new types.
- Every page's sections array must start with a "navbar" section and end with a "footer" section.
- Write real, specific, non-generic copy based on the brief. No lorem ipsum.
- Leave image URLs as empty strings ("") unless a real URL was given — the renderer shows a
  tasteful placeholder automatically. Never invent a fake image URL.
- Keep the number of pages reasonable (1-6) and sections per page reasonable (4-10).
- Respond with ONLY the JSON object, no other text.`;

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AIProviderError("ANTHROPIC_API_KEY is not set");
  }
  return new Anthropic({ apiKey });
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new AIProviderError("Model response did not contain a JSON object");
  }
  const jsonSlice = trimmed.slice(start, end + 1);
  try {
    return JSON.parse(jsonSlice);
  } catch (err) {
    throw new AIProviderError("Failed to parse model JSON response", err);
  }
}

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  private model: string;

  constructor(model?: string) {
    this.model = model || process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";
  }

  private async callForSpec(userMessage: string, priorSpec?: WebsiteSpec): Promise<WebsiteSpec> {
    const client = getClient();
    let lastError: string | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      const message = await client.messages.create({
        model: this.model,
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [
          ...(priorSpec
            ? [
                {
                  role: "user" as const,
                  content: `Current WebsiteSpec JSON:\n${JSON.stringify(priorSpec)}`,
                },
              ]
            : []),
          {
            role: "user" as const,
            content: lastError
              ? `${userMessage}\n\nYour previous JSON failed validation with: ${lastError}\nReturn corrected JSON only.`
              : userMessage,
          },
        ],
      });

      const textBlock = message.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new AIProviderError("Model response had no text content");
      }

      const parsed = extractJson(textBlock.text);
      const result = websiteSpecSchema.safeParse(parsed);
      if (result.success) {
        return result.data as WebsiteSpec;
      }
      lastError = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    }

    throw new AIProviderError(`Model output failed validation twice: ${lastError}`);
  }

  async planWebsite(brief: WebsiteBrief): Promise<WebsiteSpec> {
    const leadContext = brief.lead
      ? `\n\nLead context (a real prospective client this site is being built for):\n${JSON.stringify(brief.lead)}`
      : "";
    return this.callForSpec(`Website brief: ${brief.prompt}${leadContext}`);
  }

  async modifyWebsite(spec: WebsiteSpec, instruction: string): Promise<ModifyResult> {
    const newSpec = await this.callForSpec(
      `Apply this change to the current website and return the FULL updated WebsiteSpec JSON (not a diff): "${instruction}"`,
      spec
    );
    return {
      spec: newSpec,
      summary: `Applied: ${instruction}`,
    };
  }
}
