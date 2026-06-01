import { render } from "ink";
import * as p from "@clack/prompts";
import { App } from "./App.js";
import { EnvGuardError, resolveEnvFile } from "../core/service.js";

function validateEnvPath(value: string | undefined): string | undefined {
  if (!value?.trim()) {
    return "File path is required";
  }

  try {
    resolveEnvFile(value.trim());
  } catch (error) {
    if (error instanceof EnvGuardError) {
      return error.message;
    }
    return "Invalid file path";
  }

  return undefined;
}

export async function runTui(): Promise<number> {
  p.intro("EnvGuard");

  const fileA = await p.text({
    message: "Path to file A",
    placeholder: ".env.example",
    validate: validateEnvPath,
  });

  if (p.isCancel(fileA)) {
    p.cancel("Cancelled.");
    return 0;
  }

  const fileB = await p.text({
    message: "Path to file B",
    placeholder: ".env",
    validate: validateEnvPath,
  });

  if (p.isCancel(fileB)) {
    p.cancel("Cancelled.");
    return 0;
  }

  try {
    const { waitUntilExit } = render(<App fileA={fileA.trim()} fileB={fileB.trim()} />);
    await waitUntilExit();
    return 0;
  } catch (error) {
    if (error instanceof EnvGuardError) {
      p.log.error(error.message);
      return error.exitCode;
    }
    throw error;
  }
}
