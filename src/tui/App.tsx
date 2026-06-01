import { useMemo, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { formatChangedPair, formatKeyValue } from "../core/redact.js";
import { groupFindingsByKey } from "../core/findings.js";
import { buildDiffReport } from "../core/service.js";
import type { DiffJsonOutput, DiffViewMode } from "../types.js";

interface AppProps {
  fileA: string;
  fileB: string;
}

function countDiffItems(report: DiffJsonOutput): number {
  return report.added.length + report.removed.length + report.changed.length;
}

function SecretBadge({ count }: { count: number }) {
  if (count === 0) {
    return null;
  }
  return <Text color="red"> [!secret]</Text>;
}

function DiffSection({
  title,
  color,
  prefix,
  report,
  mode,
  redact,
}: {
  title: string;
  color: string;
  prefix: string;
  report: DiffJsonOutput;
  mode: DiffViewMode;
  redact: boolean;
}) {
  if (mode === "secrets") {
    return null;
  }

  const items =
    title === "ADDED"
      ? report.added
      : title === "REMOVED"
        ? report.removed
        : title === "CHANGED"
          ? report.changed
          : report.unchanged;

  if (items.length === 0) {
    return null;
  }

  if (mode === "diff" && title === "UNCHANGED") {
    return null;
  }

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color={color}>
        {prefix} {title} ({items.length})
      </Text>
      {title === "CHANGED"
        ? report.changed.map((item) => {
            const { oldLine, newLine } = formatChangedPair(
              item.key,
              item.oldValue,
              item.newValue,
              redact,
            );

            return (
            <Box key={item.key} flexDirection="column" marginLeft={2}>
              <Text>
                - {oldLine}
                <SecretBadge count={item.secrets?.length ?? 0} />
              </Text>
              <Text>
                + {newLine}
              </Text>
            </Box>
            );
          })
        : (items as Array<{ key: string; value: string; secrets?: DiffJsonOutput["added"][number]["secrets"] }>).map(
            (item) => (
              <Text key={item.key}>
                {"  "}
                {formatKeyValue(item.key, item.value, redact)}
                <SecretBadge count={item.secrets?.length ?? 0} />
              </Text>
            ),
          )}
    </Box>
  );
}

export function App({ fileA, fileB }: AppProps) {
  const { exit } = useApp();
  const [mode, setMode] = useState<DiffViewMode>("diff");
  const report = useMemo(() => buildDiffReport(fileA, fileB), [fileA, fileB]);
  const groupedSecrets = useMemo(() => groupFindingsByKey(report.secrets), [report.secrets]);

  useInput((input, key) => {
    if (input === "q" || (key.ctrl && input === "c")) {
      exit();
      return;
    }

    if (key.tab) {
      setMode((current) => {
        if (current === "diff") {
          return "all";
        }
        if (current === "all") {
          return "secrets";
        }
        return "diff";
      });
    }
  });

  const modeLabel =
    mode === "diff" ? "differences only" : mode === "all" ? "all entries" : "secret alerts";

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">
        EnvGuard
      </Text>
      <Text>
        A: {report.fileA}
      </Text>
      <Text>
        B: {report.fileB}
      </Text>
      <Text dimColor>
        View: {modeLabel} | differences: {countDiffItems(report)} | secrets: {groupedSecrets.length}
      </Text>

      <Box marginTop={1} flexDirection="column">
        {mode === "secrets" ? (
          groupedSecrets.length === 0 ? (
            <Text color="green">No secret patterns detected.</Text>
          ) : (
            groupedSecrets.map((finding) => (
              <Text key={finding.key}>
                [{finding.severity.toUpperCase()}] {finding.key}: {finding.reasons.join("; ")}
              </Text>
            ))
          )
        ) : countDiffItems(report) === 0 ? (
          <Text color="green">No differences found.</Text>
        ) : (
          <>
            <DiffSection
              title="ADDED"
              color="green"
              prefix="+"
              report={report}
              mode={mode}
              redact
            />
            <DiffSection
              title="REMOVED"
              color="red"
              prefix="-"
              report={report}
              mode={mode}
              redact
            />
            <DiffSection
              title="CHANGED"
              color="cyan"
              prefix="~"
              report={report}
              mode={mode}
              redact
            />
            <DiffSection
              title="UNCHANGED"
              color="gray"
              prefix="="
              report={report}
              mode={mode}
              redact
            />
          </>
        )}
      </Box>

      {report.warnings.length > 0 && mode !== "secrets" && (
        <Box marginTop={1} flexDirection="column">
          <Text color="yellow">Warnings:</Text>
          {report.warnings.map((warning) => (
            <Text key={warning} color="yellow">
              - {warning}
            </Text>
          ))}
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>[Tab] switch view  [q] quit</Text>
      </Box>
    </Box>
  );
}
