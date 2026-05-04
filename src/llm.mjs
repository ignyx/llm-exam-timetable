import { createAgent, tool } from 'langchain';
import { ChatOpenAI } from '@langchain/openai';
import * as z from 'zod';

const model = new ChatOpenAI({
  model: 'byteshape/Devstral-Small-2-24B-Instruct-2512-GGUF', // Specify a model available on OpenRouter
  configuration: {
    apiKey: 'Hello_world',
    baseURL: 'http://localhost:8080',
  },
});

const getWeather = tool((input) => `It's always sunny in ${input.city}!`, {
  name: 'get_weather',
  description: 'Get the weather for a given city',
  schema: z.object({
    city: z.string().describe('The city to get the weather for'),
  }),
});

const agent = createAgent({
  model: model,
  tools: [getWeather],
});

console.log(
  await agent.invoke({
    messages: [
      { role: 'user', content: "What's the weather in San Francisco?" },
    ],
  })
);
