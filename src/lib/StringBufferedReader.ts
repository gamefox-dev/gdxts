export class StringBufferedReader {
  lines: string[] = [];
  index = -1;

  constructor(content: string) {
    this.lines = content.split(/\r?\n/).map((s: string) => s.trim());
  }

  currentLine() {
    return this.lines[this.index];
  }

  readLine() {
    const nextIndex = this.index + 1;
    if (nextIndex >= this.lines.length) {
      return null;
    }
    const line = this.lines[nextIndex];
    this.index = nextIndex;
    return line;
  }
}
