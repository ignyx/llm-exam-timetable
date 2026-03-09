async function fetchModelAndData() {
  const modelResponse = await fetch('minizinc/thesis_scheduling_v0/model.mzn');
  const modelContent = await modelResponse.text();

  const dataResponse = await fetch(
    'minizinc/thesis_scheduling_v0/small_example_success.dzn'
  );
  const dataContent = await dataResponse.text();

  return { modelContent, dataContent };
}

async function runMiniZincModel() {
  const { modelContent, dataContent } = await fetchModelAndData();

  const model = new MiniZinc.Model();
  model.addFile('model.mzn', modelContent);
  model.addFile('data.dzn', dataContent);

  const solve = model.solve({
    options: {
      solver: 'gecode',
      'all-solutions': false,
    },
  });

  /*
  solve.on('solution', (solution) => {
    // Do something
  });
  */

  return await solve;
}

// eslint-disable-next-line no-unused-vars
async function runMinizincAndDisplay() {
  try {
    const resultsElement = document.getElementById('results');
    resultsElement.textContent = 'Running MiniZinc model...';

    const result = await runMiniZincModel();
    console.log('MiniZinc result:', result);

    const solutions = result.solution
      ? `<pre>${result.solution.output.default}</pre>
        <pre>${JSON.stringify(result.solution.output.json, null, 2)}</pre>`
      : 'No solution found';

    resultsElement.innerHTML =
      `
        <h3>MiniZinc Results</h3>
        <p><strong>Status:</strong> ${result.status}</p>
        <p><strong>Solutions:</strong></p>
      ` + solutions;
  } catch (error) {
    const resultsElement = document.getElementById('results');
    resultsElement.textContent = `Error: ${error.message}`;
    console.error('Error executing MiniZinc model:', error);
  }
}
