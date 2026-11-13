import { liveOrMockOverride } from "@/lib/rewrite";

export async function POST(request: Request) {
  const body = (await request.json()) as { title: string; draft: string };
  const result = await liveOrMockOverride(
    body.title ?? "",
    body.draft ?? "",
    process.env.OPENAI_API_KEY,
  );
  return Response.json(result);
}
