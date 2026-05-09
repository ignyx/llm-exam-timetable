import { readFileSync } from 'node:fs';
import { runLLM } from './llm.mjs';

export const toolList = `You can make tool calls to read the existing model and to make targeted changes using SEARCH/REPLACE blocks.

Available tools:
- read_model: Read the current Minizinc model.
- read_data_file: Read the Minizinc data file (.dzn) content. This file is read-only.
- search_replace: Make targeted changes to the Minizinc model using SEARCH/REPLACE blocks.
- run_model: Run the current Minizinc model and return the result status.

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

REMEMBER: You call tools.`;

export const systemPrompts = [
  {
    level: 1,
    prompt:
      `You are a Minizinc expert. Your task is to update an existing Minizinc model based on user requirements. Modify the model to meet the new requirements while ensuring it remains syntactically correct.` +
      toolList,
  },
  {
    level: 2,
    prompt:
      `You are a Minizinc expert. Your task is to update an existing Minizinc model based on user requirements. Modify the model to meet the new requirements while ensuring it remains syntactically correct.` +
      toolList +
      `

Steps:
1. Read the existing model using the read_model tool.
2. Identify and plan the changes needed to meet the new requirements.
3. Use the search_replace tool to make targeted modifications to the model.
4. Run the modified model using the run_model tool to ensure it is syntactically correct and meets the requirements.
5. If the model does not run successfully, analyze the error messages, make necessary corrections, and repeat.

Examples of valid modifications:
- Adding a new variable: "var 1..10: z;"
- Adding a constraint: "constraint x + y < 10;"
- Changing a solve statement: "solve minimize x;"
- Adding an array: "array [1..5] of var int: items;"`,
  },
  {
    level: 3,
    prompt:
      `
    # MiniZinc Documentation
Minizinc is a high-level constraint modeling language that allows you to define and solve
constraint satisfaction and optimization problems.
An example of a Minizinc model:
\`\`\` minizinc
include " globals . mzn ";
% Variables
var bool : b;
array [1..3] of var 1..10: x;
% Constraints
constraint x [1] = 1;
constraint alldifferent (x);
constraint b -> (x [2] + x [3] > 5) ;
% Objective function ( optional )
solve maximize sum (x) + 100 * bool2int (b); % maximize the sum of x plus 100 if b is
true
output [
"{\ n",
" \" b \": ", show ( bool2int (b)) , " ,\ n",
" \" x \": ", show (x) , "\ n",
"}"
];
\`\`\`
## Short API Documentation
### Global Constraints , Predicates and Standard Library Functions
- predicate all_different ( array [ $X ] of var int : x): Constrain the elements in the array
x to be pairwise different .
- predicate all_different_except_0 ( array [ $X ] of var int : vs ): Constrain the elements of
the array of integers vs to be pairwise different except for those elements that
are assigned the value 0.
- predicate all_equal ( array [ $X ] of var int : x): Constrain the elements of the array x
to be all equal .
- predicate all_disjoint ( array [ $X ] of var set of int : S): Constrain the array of sets
of integers S to be pairwise disjoint .
- predicate circuit ( array [ $$E ] of var $$E : x): Constrains the elements of x to define a
circuit where x[i] = j means that j is the successor of i.
- predicate cumulative ( array [ int ] of var int : s , array [ int ] of var int : d , array [ int ]
of var int : r , var int : b): Requires that a set of tasks given by start times s ,
durations d , and resource requirements r , never require more than a global resource
bound b at any one time . Assumptions : forall i , d[i] >= 0 and r[i] >= 0.
- predicate global_cardinality ( array [ $X ] of var $$E : x , array [ $Y ] of $$E : cover , array
[ $Y ] of var int : counts ): Requires that the number of occurrences of cover [i] in x
is counts [i ].
- predicate if_then_else ( array [ int ] of var bool : c , array [ int ] of int : x , var int : y):
Conditional constraint . This constraint is generated by the compiler for if - then -
else expressions . The last entry in the c array is always the constant true ,
corresponding to the else case .
- predicate table ( array [ $$E ] of var bool : x , array [ int , $$E ] of bool : t): Represents
the constraint x in t where we consider each row in t to be a tuple and t as a set
of tuples .
- predicate 'xor '( var bool : x , var bool : y): Return truth value of x xor y. Usage : x xor
y
- predicate minimum ( var float : m , array [ int ] of var float : x): Constrains m to be the
minimum of the values in x. Assumptions : |x| > 0.
- predicate maximum ( var $$E : m , array [ int ] of var $$E : x): Constrains m to be the
maximum of the values in x. Assumptions : |x| > 0.
- function int : abs ( int : x): Computes the absolute value of the expression .
- predicate element ( var $$E : i , array [ $$E ] of var bool : x , var bool : y): Constrains i
to be the index of the element y in the array x.
- predicate member ( array [ int ] of var bool : x , var bool : y): Requires that y occurs in
the array x.
- predicate count ( array [ $X ] of var opt $$E : x , var $$E : y , var int : c): Constrains c to
be the number of occurrences of y in x.
- predicate among ( var int : n , array [ $X ] of var $$E : x , set of $$E : v): Requires exactly
n variables in x to take one of the values in v.
- predicate nvalue ( var int : n , array [ $X ] of var int : x): Requires that the number of
distinct values in x is n.
- predicate increasing ( array [ $X ] of var bool : x): Requires that the array x is in
increasing order ( duplicates are allowed ).
- predicate inverse ( array [ $$X ] of var $$Y : f , array [ $$Y ] of var $$X : invf ): Constrains
two arrays of int variables , f and invf , to represent inverse functions . All the
values in each array must be within the index set of the other array .
- predicate at_least ( int : n , array [ $X ] of var set of $$E : x , set of $$E : v): Requires
at least n variables in x to take the value v.
- predicate exactly ( int : n , array [ $X ] of var set of $$E : x , set of $$E : v): Requires
exactly n variables in x to take the value v.
- predicate disjoint ( var set of $$E : s1 , var set of $$E : s2 ): Requires that sets s1 and
s2 do not intersect .
- function var $$E : arg_max ( array [ $$E ] of var int : x): Returns the index of the maximum
value in the array x. When breaking ties the least index is returned .
- predicate range ( array [ $$X ] of var $$Y : x , var set of $$X : s , var set of $$Y : t):
Requires that the image of function x ( represented as an array ) on set of values s
is t. ub (s) must be a subset of index_set (x) otherwise an assertion failure will
occur .
- predicate subcircuit ( array [ $$E ] of var $$E : x): Constrains the elements of x to
define a subcircuit where x[i] = j means that j is the successor of i and x[i] = i
means that i is not in the circuit .
- predicate sum_set ( array [ $$X ] of $$Y : vs , array [ $$X ] of int : ws , var set of $$Y : x ,
var int : s): Requires that the sum of the weights ws [ i1 ].. ws [ iN ] equals s , where vs
[ i1 ].. vs [ iN ] are the elements appearing in set x.

You are a Minizinc expert. Your task is to update an existing Minizinc model based on user requirements. Modify the model to meet the new requirements while ensuring it remains syntactically correct.
` + toolList,
  },
];

const prompts = [
  {
    name: 'Tiny algebraic change',
    model: `
% Minizinc model start
var 1..3: x;
var 1..3: y;
constraint x+y > 3;
solve satisfy;
% Minizinc model end`,
    data: null,
    userPrompt: `change the model to add a new variable z and a constraint that x + y + z < 5.`,
  },
  {
    name: 'scheduling v0 - no advisor in multiple juries',
    model: readFileSync('minizinc/thesis_scheduling_v0/model.mzn', 'utf-8'),
    data: readFileSync(
      'minizinc/thesis_scheduling_v0/small_example_success.dzn',
      'utf-8'
    ),
    userPrompt: `Read the model and data file. Add a new constraint that prevents any advisor from being present in more than one jury at the same slot.`,
  },
  {
    name: 'scheduling v0 - no advisor in multiple juries',
    model: readFileSync('minizinc/thesis_scheduling_v0/model.mzn', 'utf-8'),
    data: readFileSync(
      'minizinc/thesis_scheduling_v0/small_example_success.dzn',
      'utf-8'
    ),
    userPrompt: `Actually, students must attend 2 sessions.`,
  },
  {
    name: 'scheduling v1 - no advisor in multiple juries',
    model: readFileSync('minizinc/thesis_scheduling_v0/model.mzn', 'utf-8'),
    data: readFileSync(
      'minizinc/thesis_scheduling_v1/small_example_success.dzn',
      'utf-8'
    ),
    userPrompt: `Add a new constraint that prevents any advisor from being present in more than one jury at the same slot.`,
  },
];

export const runEval = async () => {
  let results = [];
  for (const systemPrompt of systemPrompts) {
    console.log(`\n\n=== System Prompt Level ${systemPrompt.level} ===\n\n`);
    for (const prompt of prompts) {
      console.log(`\n--- Prompt: ${prompt.name} ---\n`);
      // run 5 times
      for (let i = 0; i < 5; i++) {
        console.log(`\nRun ${i + 1}:\n`);
        try {
          const result = await runLLM({
            systemPrompt: systemPrompt.prompt,
            userPrompt: prompt.userPrompt,
            model: prompt.model,
            data: prompt.data,
          });
          const { output, tokenCount, finalModel, turnCount, duration } =
            result;
          console.log('LLM Result:', result);
          results.push({
            systemPromptLevel: systemPrompt.level,
            promptName: prompt.name,
            run: i + 1,
            tokenCount,
            turnCount,
            duration,
          });
        } catch (error) {
          console.error('Error:', error);
          results.push({
            systemPromptLevel: systemPrompt.level,
            promptName: prompt.name,
            run: i + 1,
            error: error.message,
          });
        }
      }
    }
  }
  console.log('\n\n=== Evaluation Results ===\n\n');
  results.forEach(console.log);
};

await runEval();
