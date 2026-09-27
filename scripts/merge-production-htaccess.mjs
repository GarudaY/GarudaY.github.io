import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SONNENBLUME_BEGIN = "# BEGIN SONNENBLUME legacy redirects";
const SONNENBLUME_END = "# END SONNENBLUME legacy redirects";
const WORDPRESS_BEGIN = "# BEGIN WordPress";
const WORDPRESS_END = "# END WordPress";

function linesWithOffsets(content) {
  const lines = [];
  let start = 0;
  while (start < content.length) {
    let contentEnd = start;
    while (
      contentEnd < content.length &&
      content[contentEnd] !== "\r" &&
      content[contentEnd] !== "\n"
    ) {
      contentEnd += 1;
    }
    let end = contentEnd;
    if (content[end] === "\r" && content[end + 1] === "\n") end += 2;
    else if (content[end] === "\r" || content[end] === "\n") end += 1;
    lines.push({
      text: content.slice(start, contentEnd),
      start,
      contentEnd,
      end,
    });
    start = end;
  }
  return lines;
}

function countOccurrences(content, marker) {
  let count = 0;
  let offset = 0;
  while ((offset = content.indexOf(marker, offset)) !== -1) {
    count += 1;
    offset += marker.length;
  }
  return count;
}

function findMarkedBlock(content, beginMarker, endMarker, { required }) {
  const lines = linesWithOffsets(content);
  const beginLines = lines.filter(
    (line) => line.text.trimEnd() === beginMarker,
  );
  const endLines = lines.filter((line) => line.text.trimEnd() === endMarker);
  const rawBeginCount = countOccurrences(content, beginMarker);
  const rawEndCount = countOccurrences(content, endMarker);

  if (rawBeginCount !== beginLines.length || rawEndCount !== endLines.length) {
    throw new Error(
      `Malformed marker line for ${beginMarker.replace("# BEGIN ", "")}.`,
    );
  }
  if (!rawBeginCount && !rawEndCount && !required) return null;
  if (
    rawBeginCount !== 1 ||
    rawEndCount !== 1 ||
    beginLines.length !== 1 ||
    endLines.length !== 1
  ) {
    throw new Error(
      `Expected exactly one complete ${beginMarker.replace("# BEGIN ", "")} block.`,
    );
  }
  const begin = beginLines[0];
  const end = endLines[0];
  if (begin.start >= end.start) {
    throw new Error(
      `Invalid marker order for ${beginMarker.replace("# BEGIN ", "")}.`,
    );
  }
  return {
    start: begin.start,
    contentEnd: end.contentEnd,
    end: end.end,
  };
}

function newlineFor(content) {
  const match = content.match(/\r\n|\n|\r/);
  return match?.[0] || "\n";
}

function normalizeNewlines(content, newline) {
  return content.replace(/\r\n|\n|\r/g, newline);
}

export function mergeHtaccess(current, generatedRules) {
  const wordpress = findMarkedBlock(current, WORDPRESS_BEGIN, WORDPRESS_END, {
    required: true,
  });
  const currentSonnenblume = findMarkedBlock(
    current,
    SONNENBLUME_BEGIN,
    SONNENBLUME_END,
    { required: false },
  );
  const generatedSonnenblume = findMarkedBlock(
    generatedRules,
    SONNENBLUME_BEGIN,
    SONNENBLUME_END,
    { required: true },
  );
  if (
    generatedRules.slice(0, generatedSonnenblume.start).trim() ||
    generatedRules.slice(generatedSonnenblume.contentEnd).trim()
  ) {
    throw new Error(
      "Generated redirect file must contain only its marked block.",
    );
  }
  if (currentSonnenblume && currentSonnenblume.start > wordpress.start) {
    throw new Error(
      "Existing SONNENBLUME redirect block must be before the WordPress block.",
    );
  }

  const newline = newlineFor(current);
  const generatedBlock = normalizeNewlines(
    generatedRules.slice(
      generatedSonnenblume.start,
      generatedSonnenblume.contentEnd,
    ),
    newline,
  );
  const originalWordPress = current.slice(
    wordpress.start,
    wordpress.contentEnd,
  );

  let merged;
  if (currentSonnenblume) {
    merged =
      current.slice(0, currentSonnenblume.start) +
      generatedBlock +
      current.slice(currentSonnenblume.contentEnd);
  } else {
    merged =
      current.slice(0, wordpress.start) +
      generatedBlock +
      newline +
      newline +
      current.slice(wordpress.start);
  }

  const mergedWordPress = findMarkedBlock(
    merged,
    WORDPRESS_BEGIN,
    WORDPRESS_END,
    { required: true },
  );
  if (
    merged.slice(mergedWordPress.start, mergedWordPress.contentEnd) !==
    originalWordPress
  ) {
    throw new Error("WordPress rewrite block changed during merge.");
  }
  const mergedSonnenblume = findMarkedBlock(
    merged,
    SONNENBLUME_BEGIN,
    SONNENBLUME_END,
    { required: true },
  );
  if (mergedSonnenblume.start > mergedWordPress.start) {
    throw new Error("Merged redirect block is not before WordPress rules.");
  }
  return merged;
}

export async function writeMergedHtaccess({
  currentPath,
  rulesPath,
  outputPath,
}) {
  if (!currentPath || !rulesPath || !outputPath) {
    throw new Error("--current, --rules and --output are all required.");
  }
  const resolvedCurrent = path.resolve(currentPath);
  const resolvedRules = path.resolve(rulesPath);
  const resolvedOutput = path.resolve(outputPath);
  if (resolvedOutput === resolvedCurrent || resolvedOutput === resolvedRules) {
    throw new Error(
      "Output must be a new file; source files are never overwritten.",
    );
  }
  const [current, generatedRules] = await Promise.all([
    readFile(resolvedCurrent, "utf8"),
    readFile(resolvedRules, "utf8"),
  ]);
  const merged = mergeHtaccess(current, generatedRules);
  await writeFile(resolvedOutput, merged, { encoding: "utf8", flag: "wx" });
  return resolvedOutput;
}

function parseArguments(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (!value || !["--current", "--rules", "--output"].includes(flag)) {
      throw new Error(
        "Usage: node scripts/merge-production-htaccess.mjs --current <downloaded-.htaccess> --rules <legacy-redirects.htaccess> --output <preview-.htaccess>",
      );
    }
    options[flag.slice(2)] = value;
  }
  return options;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const options = parseArguments(process.argv.slice(2));
    const output = await writeMergedHtaccess({
      currentPath: options.current,
      rulesPath: options.rules,
      outputPath: options.output,
    });
    console.log(`Merged .htaccess preview written to ${output}`);
  } catch (error) {
    console.error(`Failed to merge .htaccess: ${error.message}`);
    process.exitCode = 1;
  }
}
