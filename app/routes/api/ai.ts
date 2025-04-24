import Anthropic from '@anthropic-ai/sdk';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const APIRoute = createAPIFileRoute('/api/ai')({
  GET: async ({ request }) => {
    try {
      const { moods, note, usersTimeZone } = await request.json();

      // Prepare the prompt for Claude
      const prompt = `Analyze the following mood data and generate personalized insights about patterns:
      Mood entries: ${JSON.stringify(moods)}
      Additional notes: ${note || 'None'}
      User's timezone: ${usersTimeZone}
      
      Please generate three sections of analysis:
      1. Weekly Patterns - How mood varies across different days of the week
      2. Time of Day - How mood changes throughout the day
      3. Monthly Trends - Overall mood changes compared to previous periods
      
      Format the response as JSON with three keys: weeklyPatterns, timeOfDay, and monthlyTrends.
      Each should contain a natural, personalized insight about the patterns observed.`;

      const response = await anthropic.messages.create({
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
        model: 'claude-3-5-sonnet-latest',
      });

      // Get the assistant's response content
      const assistantMessage = response.content[0].text;
      const analysis = JSON.parse(assistantMessage);

      return new Response(JSON.stringify(analysis), {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error analyzing mood patterns:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to analyze mood patterns' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  },
});
