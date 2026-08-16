import { getStorageBackend } from "./client";
import { feedbackRepoPg } from "./feedback";
import { feedbackRepoJson } from "./json/feedback";
import { interviewRepoJson } from "./json/interviews";
import { passwordResetRepoJson } from "./json/passwordReset";
import { resumeRepoJson } from "./json/resumes";
import { userRepoJson } from "./json/users";
import { interviewRepoPg } from "./interviews";
import { passwordResetRepoPg } from "./passwordReset";
import { resumeRepoPg } from "./resumes";
import { userRepoPg } from "./users";

function pick<T>(pg: T, json: T): T {
  return getStorageBackend() === "postgres" ? pg : json;
}

export const userRepo = pick(userRepoPg, userRepoJson);
export const resumeRepo = pick(resumeRepoPg, resumeRepoJson);
export const interviewRepo = pick(interviewRepoPg, interviewRepoJson);
export const feedbackRepo = pick(feedbackRepoPg, feedbackRepoJson);
export const passwordResetRepo = pick(passwordResetRepoPg, passwordResetRepoJson);

export { getStorageBackend, isPostgres, closePool } from "./client";
export { runMigrations } from "./migrate";
