"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Select } from "@/components/ui";

import type { TeacherClass } from "../data";

/**
 * Class scope selector. Navigation-only: it rewrites the `class` query
 * param on the current teacher page, and the server components refetch
 * for the newly selected class.
 */
export function ClassSwitcher({
  classes,
  activeClassId,
}: {
  classes: TeacherClass[];
  activeClassId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <Select
      label="Class"
      value={activeClassId}
      onChange={(event) => {
        const params = new URLSearchParams(searchParams);
        params.set("class", event.target.value);
        router.push(`${pathname}?${params.toString()}`);
      }}
    >
      {classes.map((teacherClass) => (
        <option key={teacherClass.id} value={teacherClass.id}>
          {teacherClass.name}
          {teacherClass.yearLevel === null ? "" : ` — Year ${teacherClass.yearLevel}`}
        </option>
      ))}
    </Select>
  );
}
