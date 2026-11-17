"use client";

import { CHILD_PROGRAMMES, type ChildProgrammeId } from "../child-programmes";

/**
 * Multi-select chips for "which programmes is this child enrolled in or
 * interested in?". Shared by AddChildCard and SignUpWizard. Optional by
 * design: an empty selection is valid.
 */
export function ProgrammePicker({
  value,
  onChange,
  legend = "Programmes (optional)",
  idPrefix = "programmes",
}: {
  value: readonly ChildProgrammeId[];
  onChange: (next: ChildProgrammeId[]) => void;
  legend?: string;
  idPrefix?: string;
}) {
  function toggle(id: ChildProgrammeId) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-semibold text-ink">{legend}</legend>
      <p className="text-sm text-muted">
        Pick any they&apos;re enrolled in or interested in. You can choose more than one.
      </p>
      <div className="mt-1 flex flex-wrap gap-2">
        {CHILD_PROGRAMMES.map((programme) => {
          const checked = value.includes(programme.id);
          const id = `${idPrefix}-${programme.id}`;
          return (
            <label
              key={programme.id}
              htmlFor={id}
              className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-within:ring-2 focus-within:ring-royal ${
                checked
                  ? "border-royal bg-royal/10 text-royal"
                  : "border-line bg-white text-ink hover:border-royal/50"
              }`}
            >
              <input
                id={id}
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={() => toggle(programme.id)}
              />
              <span>{programme.label}</span>
              <span className="hidden font-normal text-muted sm:inline">· {programme.hint}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
