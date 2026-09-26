import fs from 'fs';
import readline from 'readline';

const transcriptPath = 'C:/Users/Ai/.gemini/antigravity-ide/brain/fe419129-bb7c-4a98-9998-2024e5f21303/.system_generated/logs/transcript_full.jsonl';

async function processLineByLine() {
  const fileStream = fs.createReadStream(transcriptPath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const files = {};

  for await (const line of rl) {
    try {
      const entry = JSON.parse(line);
      if (entry.tool_calls) {
        for (const tc of entry.tool_calls) {
          if (tc.name === 'write_to_file' || tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') {
            const target = tc.args.TargetFile || tc.args.TargetFile;
            if (target && !files[target]) {
              // Only capture the FIRST write for each file
              if (tc.name === 'write_to_file') {
                files[target] = tc.args.CodeContent;
              }
            }
          }
        }
      }
    } catch (e) {
      // ignore parse errors
    }
  }

  // Write the extracted first versions
  for (const [filepath, content] of Object.entries(files)) {
    console.log(`Restoring: ${filepath}`);
    try {
        fs.writeFileSync(filepath, content);
    } catch (e) {
        console.log(`Failed to restore ${filepath}: ${e}`);
    }
  }
}

processLineByLine();
