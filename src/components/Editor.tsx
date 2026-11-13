"use client";

import { contentTypes } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { Button, Card, Field, inputClass } from "./ui";

export function Editor() {
  const { current, me, updateCurrent, loadSample, newDraft, runScan, saveDraft, submit, setImage } =
    useStore();
  const editable =
    (current.status === "draft" || current.status === "changes_requested") &&
    (me.role === "creator" || current.author === me.name);

  return (
    <Card
      title="Content"
      action={
        <div className="flex flex-wrap gap-2">
          <Button onClick={loadSample}>Load sample with issues</Button>
          <Button onClick={newDraft}>New draft</Button>
        </div>
      }
    >
      <div className="space-y-3">
        <Field label="Title" htmlFor="title">
          <input
            id="title"
            className={inputClass}
            value={current.title}
            disabled={!editable}
            onChange={(e) => updateCurrent({ title: e.target.value })}
          />
        </Field>
        <Field label="Format" htmlFor="type">
          <select
            id="type"
            className={inputClass}
            value={current.type}
            disabled={!editable}
            onChange={(e) =>
              updateCurrent({ type: e.target.value as typeof current.type })
            }
          >
            {contentTypes().map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Text (paste copy here)" htmlFor="body">
          <textarea
            id="body"
            className={`${inputClass} min-h-44`}
            value={current.text}
            disabled={!editable}
            onChange={(e) => updateCurrent({ text: e.target.value })}
          />
        </Field>
        <Field label="Image (optional, stays in this browser)" htmlFor="img">
          <input
            id="img"
            type="file"
            accept="image/*"
            disabled={!editable}
            className="text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                if (typeof reader.result === "string") setImage(reader.result);
              };
              reader.readAsDataURL(file);
            }}
          />
        </Field>
        {current.hasImg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.img || "/samples/test-image.png"}
            alt={current.alt || "Attached preview"}
            className="max-h-36 rounded-lg border border-navy/10"
          />
        )}
        <Field label="Image alt text" htmlFor="alt">
          <input
            id="alt"
            className={inputClass}
            value={current.alt}
            disabled={!editable}
            onChange={(e) => updateCurrent({ alt: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Text colour (hex)" htmlFor="fg">
            <input
              id="fg"
              className={inputClass}
              placeholder="#0B3D91"
              value={current.fg}
              disabled={!editable}
              onChange={(e) => updateCurrent({ fg: e.target.value })}
            />
          </Field>
          <Field label="Background colour (hex)" htmlFor="bg">
            <input
              id="bg"
              className={inputClass}
              placeholder="#FFFFFF"
              value={current.bg}
              disabled={!editable}
              onChange={(e) => updateCurrent({ bg: e.target.value })}
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="primary" onClick={runScan}>
            Run brand check
          </Button>
          <Button onClick={() => saveDraft()} disabled={!editable}>
            Save draft
          </Button>
          <Button variant="primary" onClick={submit} disabled={!editable}>
            {current.submitCount > 0 ? "Resubmit for review" : "Submit for review"}
          </Button>
        </div>
        {!editable && (
          <p className="text-sm text-slate-500">
            This piece is locked while it is {current.status.replace("_", " ")}. Switch to the
            creator to edit, or wait for a reviewer decision.
          </p>
        )}
      </div>
    </Card>
  );
}
