import "server-only";

import type { UatGitHubCreateRequest, UatGitHubLink } from "../types";
import { redactSensitiveText } from "../utils/redaction";
import { resolveConfiguredGitHubRepo } from "./uat-access";

export type CreateGitHubIssueOutcome =
  | { readonly ok: true; readonly githubIssue: UatGitHubLink }
  | {
      readonly ok: false;
      readonly code: "github_not_configured" | "github_request_failed";
      readonly message: string;
    };

type EnvMap = Readonly<Record<string, string | undefined>>;

export async function createGitHubIssueForDefect(
  request: UatGitHubCreateRequest,
  env: EnvMap = process.env,
): Promise<CreateGitHubIssueOutcome> {
  const token = env.MM_UAT_GITHUB_TOKEN?.trim();
  if (!token) {
    return {
      ok: false,
      code: "github_not_configured",
      message:
        "MM_UAT_GITHUB_TOKEN is not configured on this DEV server. Copy the formatted Markdown below to paste into GitHub manually.",
    };
  }

  const repo = resolveConfiguredGitHubRepo(env);
  const [owner, repoName] = repo.split("/");
  const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner!)}/${encodeURIComponent(repoName!)}/issues`;

  const sanitizedTitle = redactSensitiveText(request.title).slice(0, 200);
  const sanitizedBody = redactSensitiveText(request.body).slice(0, 60000);
  const labels = ["uat", `severity:${request.severity}`, `category:${request.category.replace(/_/g, "-")}`];

  const postIssue = async (withLabels: boolean) =>
    fetch(apiUrl, {
      method: "POST",
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        "x-github-api-version": "2022-11-28",
        "user-agent": "MindMosaic-UAT-Assistant",
      },
      body: JSON.stringify(
        withLabels ? { title: sanitizedTitle, body: sanitizedBody, labels } : { title: sanitizedTitle, body: sanitizedBody },
      ),
    });

  try {
    let response = await postIssue(true);
    // Fine-grained PATs with Issues write but without label creation rights can 403/422 on unknown labels; retry cleanly without labels.
    if (response.status === 422) {
      response = await postIssue(false);
    }

    if (!response.ok) {
      return {
        ok: false,
        code: "github_request_failed",
        message: `GitHub API returned ${response.status} ${response.statusText}. Your local defect is still saved.`,
      };
    }

    const data = (await response.json()) as { number?: number; html_url?: string };
    if (typeof data.number !== "number" || typeof data.html_url !== "string") {
      return {
        ok: false,
        code: "github_request_failed",
        message: "GitHub returned an unexpected response payload.",
      };
    }

    return {
      ok: true,
      githubIssue: {
        number: data.number,
        url: data.html_url,
        repo,
        createdAt: new Date().toISOString(),
      },
    };
  } catch {
    return {
      ok: false,
      code: "github_request_failed",
      message: "Could not connect to the GitHub API. Your local defect is still saved.",
    };
  }
}
