import { createAgent, tool } from 'langchain';
import { ChatOpenAI } from '@langchain/openai';
import * as z from 'zod';
import * as MiniZinc from 'minizinc';

const runLLM = async ({
  temperature = 0.3,
  systemPrompt = 'You are a helpful assistant.',
  userPrompt = 'What is the weather like today?',
  modelName = 'byteshape/Devstral-Small-2-24B-Instruct-2512-GGUF',
  minizincModel = 'var 1..3: x;\nvar 1..3: y;\nconstraint x+y > 3;\nsolve satisfy;',
  minizincDataFile = null,
}) => {
  const llm = new ChatOpenAI({
    model: modelName,
    temperature,
    configuration: {
      apiKey: 'Hello_world',
      baseURL: 'http://localhost:8080',
    },
  });
  const modelRef = { val: minizincModel };

  const agent = createAgent({
    model: llm,
    tools: [
      readModelTool(modelRef),
      searchReplaceTool(modelRef),
      runModelTool(modelRef, minizincDataFile),
      readDataFileTool(minizincDataFile),
    ],
    systemPrompt,
  });

  const startTime = Date.now();
  const response = await agent.invoke({
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });
  const endTime = Date.now();

  const messageWithTokenUsage = response.messages.filter(
    (m) => m.usage_metadata
  );
  const tokenCount =
    messageWithTokenUsage[messageWithTokenUsage.length - 1].usage_metadata
      .total_tokens;

  return {
    output: response,
    tokenCount: tokenCount,
    finalModel: modelRef.val,
    turnCount: response.messages.length,
    duration: (endTime - startTime) / 1000,
  };
};

const SYSTEM_PROMPT = `You are a Minizinc expert.
You will be given an existing model and a new requirement.
You will modify the model to meet the new requirement.
Always ensure that the modified model is syntactically correct and adheres to Minizinc standards.
You can make tool calls to read the existing model and to make targeted changes using SEARCH/REPLACE blocks.

Available tools:
- read_model: Read the current Minizinc model.
- search_replace: Make targeted changes to the Minizinc model using SEARCH/REPLACE blocks.
- run_model: Run the current Minizinc model and return the result status.
- read_data_file: Read the Minizinc data file (.dzn) content. This file is read-only.

Arguments:
- content: The SEARCH/REPLACE blocks defining the changes

The content format is:

"""
<<<<<<< SEARCH
[exact text to find in the file]
=======
[exact text to replace it with]
>>>>>>> REPLACE
"""

You can include multiple SEARCH/REPLACE blocks to make multiple changes to the same file:

"""
<<<<<<< SEARCH
def old_function():
    return "old value"
=======
def new_function():
    return "new value"
>>>>>>> REPLACE

<<<<<<< SEARCH
import os
=======
import os
import sys
>>>>>>> REPLACE
"""

IMPORTANT:

- The SEARCH text must match EXACTLY (including whitespace, indentation, and line endings)
- The SEARCH text must appear exactly once in the file - if it appears multiple times, the tool will error
- Use at least 5 equals signs (=====) between SEARCH and REPLACE sections
- The tool will provide detailed error messages showing context if search text is not found
- Each search/replace block is applied in order, so later blocks see the results of earlier ones
- Be careful with escape sequences in string literals - use \n not \\n for newlines in code

REMEBER: You call tools.
`;

let existingModel = `
% Minizinc model start
var 1..3: x;
var 1..3: y;
constraint x+y > 3;
solve satisfy;
% Minizinc model end`;

const readModelTool = (modelRef) =>
  tool(() => modelRef.val, {
    name: 'read_model',
    description: 'Read the current Minizinc model',
  });

const readDataFileTool = (dataFile) =>
  tool(() => dataFile ?? 'No Minizinc data file available.', {
    name: 'read_data_file',
    description:
      'Read the Minizinc data file (.dzn) content. This file is read-only.',
  });

const searchReplaceTool = (modelRef) =>
  tool(
    (input) => {
      const blocks = input.content
        .split(/<<<<<<< SEARCH|=======|>>>>>>> REPLACE/g)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      console.log('Received SEARCH/REPLACE content:', input);
      console.log('Parsed SEARCH/REPLACE blocks:', blocks);
      if (blocks.length === 0)
        throw new Error(
          `No valid SEARCH/REPLACE blocks found in content\nPlease ensure the content follows the specified format with proper delimiters.`
        );
      if (blocks.length % 2 !== 0) {
        throw new Error(
          `Invalid SEARCH/REPLACE format: expected pairs of SEARCH and REPLACE blocks, but got an odd number of blocks (${blocks.length}). Please ensure each SEARCH block has a corresponding REPLACE block.`
        );
      }
      for (let i = 0; i < blocks.length; i += 2) {
        const searchText = blocks[i];
        const replaceText = blocks[i + 1];
        const occurrences = modelRef.val.split(searchText).length - 1;
        if (occurrences === 0) {
          throw new Error(
            `SEARCH text not found:\n${searchText}\n\nContext:\n${modelRef.val}`
          );
        } else if (occurrences > 1) {
          throw new Error(
            `SEARCH text found multiple times (${occurrences} occurrences):\n${searchText}\n\nContext:\n${modelRef.val}`
          );
        }
        modelRef.val = modelRef.val.replace(searchText, replaceText);
      }
      return 'Model updated successfully';
    },
    {
      name: 'search_replace',
      description:
        'Make targeted changes to the Minizinc model using SEARCH/REPLACE blocks',
      schema: z.object({
        content: z
          .string()
          .min(10)
          .describe('The SEARCH/REPLACE blocks defining the changes'),
      }),
    }
  );

const runModelTool = (modelRef, dataFile) =>
  tool(
    async () => {
      const modelInstance = new MiniZinc.Model();
      modelInstance.addString(modelRef.val);
      if (dataFile) {
        modelInstance.addDznString(dataFile);
      }
      const result = await modelInstance.solve({
        options: {
          solver: 'gecode',
          'time-limit': 10000,
          statistics: true,
        },
      });
      console.log('Model run result:', result);
      return result.status;
    },
    {
      name: 'run_model',
      description:
        'Run the current Minizinc model with optional data file and return the result status',
    }
  );

console.log(
  await runLLM({
    userPrompt: `Look at the model and Explain what the model does.
    Then change the model to add a new variable z and a constraint that x + y + z < 5.
    Finally, run the modified model and return the result status.`,
    systemPrompt: SYSTEM_PROMPT,
    minizincModel: existingModel,
  })
);
