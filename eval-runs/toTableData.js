/** This file contains helper functions to convert the raw data from eval runs into a format suitable for LaTeX tables. */
function calculateAverages(data) {
  const results = {};

  // Initialize all unique systemPromptLevel/promptName pairs
  data.forEach((entry) => {
    const key = `${entry.systemPromptLevel}_${entry.promptName}`;
    if (!results[key]) {
      results[key] = {
        systemPromptLevel: entry.systemPromptLevel,
        promptName: entry.promptName,
        successfulRuns: 0,
        totalTokenCount: 0,
        totalTurnCount: 0,
        totalDuration: 0,
      };
    }
  });

  // Process successful runs
  data.forEach((entry) => {
    const key = `${entry.systemPromptLevel}_${entry.promptName}`;
    if (!entry.error) {
      if (
        entry.modelHasChanged &&
        (entry.modelStatus == 'SATISFIED' ||
          entry.modelStatus == 'OPTIMAL_SOLUTION')
      )
        results[key].successfulRuns += 1;
      results[key].totalTokenCount += entry.tokenCount || 0;
      results[key].totalTurnCount += entry.turnCount || 0;
      results[key].totalDuration += entry.duration || 0;
    }
  });

  // Calculate averages
  const output = [];
  for (const key in results) {
    const {
      systemPromptLevel,
      promptName,
      successfulRuns,
      totalTokenCount,
      totalTurnCount,
      totalDuration,
    } = results[key];
    output.push({
      systemPromptLevel,
      promptName,
      successfulRuns,
      avgTokenCount: successfulRuns > 0 ? totalTokenCount / successfulRuns : 0,
      avgTurnCount: successfulRuns > 0 ? totalTurnCount / successfulRuns : 0,
      avgDuration: successfulRuns > 0 ? totalDuration / successfulRuns : 0,
    });
  }

  return output;
}

// Copy from last lines of run files.
let data = [
  {
    systemPromptLevel: 1,
    promptName: 'Tiny algebraic change',
    run: 1,
    tokenCount: 1097,
    turnCount: 6,
    duration: 5.965,
  }, // ...
];

calculateAverages(data)
  .map(
    (a) =>
      `SuperModel & ${a.promptName} & Level ${a.systemPromptLevel} & ${a.successfulRuns}/5 & ${a.avgTurnCount} & ${a.avgTokenCount} & ${a.avgDuration} \\`
  )
  .join('\n');

calculateAverages(data)
  .map((a) => `${a.successfulRuns}/5 & `)
  .join('');
