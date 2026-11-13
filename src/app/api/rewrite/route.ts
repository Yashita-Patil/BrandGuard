import { liveOrMockRewrite } from "@/lib/rewrite";
import type { RewriteInput } from "@/lib/rewrite";

export async function POST(request: Request) {
  const body = (await request.json()) as RewriteInput;
  const proposal = await liveOrMockRewrite(body, process.env.OPENAI_API_KEY);
  return Response.json(proposal);
}
