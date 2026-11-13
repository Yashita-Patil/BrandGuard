"use client";

import { useStore } from "@/lib/store";
import { Button, Card } from "./ui";

export function Trust() {
  const { resetDemo } = useStore();
  return (
    <Card title="How this tool works and what it protects">
      <div className="space-y-3 text-sm leading-6">
        <p>
          <b>AI disclosure.</b> Compliance findings always come from the deterministic
          Brand Kit rule engine. Optional rewrite and override-coach calls use{" "}
          <code>OPENAI_API_KEY</code> when the server has it; otherwise a kit-grounded
          mock rewriter runs so the demo still works. The engine re-checks every
          proposal. Nothing is applied until you accept a rewrite or paste/edit an
          override.
        </p>
        <p>
          <b>Confidentiality.</b> Brand rules, drafts, images, and comments stay in this
          browser’s local storage. If a live model is configured, only rewrite/override
          prompts leave the server. Fonts are served by the app.
        </p>
        <p>
          <b>Human control.</b> Suggestions never apply on their own. “Apply all safe
          fixes” only runs when you click it, and only for replacements with a known
          preferred phrase. Approval needs a manager or reviewer who is not the author.
          Approving over open high-severity issues requires a written override that is
          logged on the decision trail.
        </p>
        <p>
          <b>Known limits.</b> Rule matching can miss meaning-level problems such as
          sarcasm, and image pixels are not analysed. Roles are simulated for the demo.
        </p>
        <Button onClick={resetDemo}>Reset demo data</Button>
      </div>
    </Card>
  );
}
