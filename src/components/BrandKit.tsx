"use client";

import { useState } from "react";
import { PALETTE } from "@/lib/brand";
import { useStore } from "@/lib/store";
import { Button, Card, Tag, inputClass } from "./ui";

export function BrandKit() {
  const { state, addTerm, deleteRule } = useStore();
  const [avoid, setAvoid] = useState("");
  const [prefer, setPrefer] = useState("");
  const [why, setWhy] = useState("");
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <Card title="Terminology and tone rules">
          <table className="w-full text-left text-sm">
            <tbody>
              {state.rules.map((rule) => (
                <tr key={rule.id} className="border-b border-navy/10 align-top">
                  <td className="py-2 pr-2">
                    <Tag tone="neutral">{rule.cat}</Tag>
                  </td>
                  <td className="py-2 pr-2">
                    {rule.why}
                    <div className="text-xs text-slate-500">{rule.src}</div>
                  </td>
                  <td className="py-2">
                    {rule.custom ? (
                      <Button onClick={() => deleteRule(rule.id)}>Remove</Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Add a terminology rule">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              className={inputClass}
              placeholder="Avoid (e.g. synergy)"
              aria-label="Avoid"
              value={avoid}
              onChange={(e) => setAvoid(e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Prefer (e.g. teamwork)"
              aria-label="Prefer"
              value={prefer}
              onChange={(e) => setPrefer(e.target.value)}
            />
          </div>
          <input
            className={`${inputClass} mt-2`}
            placeholder="Reason (optional)"
            value={why}
            onChange={(e) => setWhy(e.target.value)}
          />
          <div className="mt-3">
            <Button
              variant="primary"
              onClick={() => {
                addTerm(avoid, prefer, why);
                setAvoid("");
                setPrefer("");
                setWhy("");
              }}
            >
              Add rule
            </Button>
          </div>
        </Card>
      </div>
      <div className="space-y-4">
        <Card title="Approved facts">
          {state.facts.map((fact) => (
            <div key={fact.id} className="border-b border-navy/10 py-2 text-sm">
              <b>{fact.label}</b>
              <div className="text-xs text-slate-500">{fact.src}</div>
            </div>
          ))}
        </Card>
        <Card title="Approved palette">
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((color) => (
              <span
                key={color}
                className="flex items-center gap-2 rounded-lg border border-navy/10 px-2 py-1 text-sm"
              >
                <span
                  className="inline-block h-4 w-4 rounded border border-navy/20"
                  style={{ background: color }}
                />
                {color}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
