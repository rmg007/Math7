import * as fs from "fs";

export interface HistoryRecord {
  date: string;
  score: number;
  coverage: number;
  failures: number;
}

export class Historian {
  private historyPath: string;
  private maxRuns: number;

  constructor(historyPath: string, maxRuns: number) {
    this.historyPath = historyPath;
    this.maxRuns = maxRuns;
  }

  record(record: HistoryRecord) {
    let history: HistoryRecord[] = this.getHistory();
    history.push(record);
    if (history.length > this.maxRuns) history = history.slice(-this.maxRuns);
    fs.writeFileSync(this.historyPath, JSON.stringify(history, null, 2));
    return history;
  }

  getHistory(): HistoryRecord[] {
    if (!fs.existsSync(this.historyPath)) return [];
    try {
      return JSON.parse(fs.readFileSync(this.historyPath, "utf-8"));
    } catch {
      return [];
    }
  }
}
