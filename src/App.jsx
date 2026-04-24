import { useState } from 'react';
import './App.css';

function ExamTimetableApp() {
  const [status, setStatus] = useState('Loading...');
  const [results, setResults] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function fetchModelAndData() {
    const modelResponse = await fetch(
      '/minizinc/thesis_scheduling_v0/model.mzn'
    );
    const modelContent = await modelResponse.text();

    const dataResponse = await fetch(
      '/minizinc/thesis_scheduling_v0/small_example_success.dzn'
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

    return await solve;
  }

  async function handleExecute() {
    try {
      setIsLoading(true);
      setStatus('Running MiniZinc model...');
      setResults('');

      const result = await runMiniZincModel();
      console.log('MiniZinc result:', result);

      const solutions = result.solution
        ? `<pre>${result.solution.output.default}</pre>
          <pre>${JSON.stringify(result.solution.output.json, null, 2)}</pre>`
        : 'No solution found';

      setResults(
        `
          <h3>MiniZinc Results</h3>
          <p><strong>Status:</strong> ${result.status}</p>
          <p><strong>Solutions:</strong></p>
        ` + solutions
      );
      setStatus('Model execution complete');
    } catch (error) {
      setResults(`Error: ${error.message}`);
      setStatus('Error occurred');
      console.error('Error executing MiniZinc model:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="app">
      <h1>Exam Timetable App</h1>
      <p
        data-testid="status"
        className={`status ${status.includes('Error') ? 'error' : ''}`}
      >
        {status}
      </p>
      <button
        data-testid="execute-button"
        onClick={handleExecute}
        disabled={isLoading}
      >
        {isLoading ? 'Running...' : 'Execute MiniZinc Model'}
      </button>
      <div id="results" dangerouslySetInnerHTML={{ __html: results }} />
    </div>
  );
}

export default ExamTimetableApp;
