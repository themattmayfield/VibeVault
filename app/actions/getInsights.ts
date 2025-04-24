import Anthropic from '@anthropic-ai/sdk';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MoodSchema = z.object({
  moods: z.array(
    z.object({
      mood: z.union([
        z.literal('happy'),
        z.literal('excited'),
        z.literal('calm'),
        z.literal('neutral'),
        z.literal('tired'),
        z.literal('stressed'),
        z.literal('sad'),
        z.literal('angry'),
        z.literal('anxious'),
      ]),
      note: z.string().optional(),
      _creationTime: z.number(),
    })
  ),
  usersTimeZone: z.string(),
});

export const getPatterns = createServerFn({
  method: 'GET',
})
  .validator(MoodSchema)
  .handler(async ({ data: { moods, usersTimeZone } }) => {
    // Prepare the prompt for Claude
    const prompt = `Analyze the following mood data and generate personalized insights about patterns:
    Mood entries: ${JSON.stringify(moods)}
    User's timezone: ${usersTimeZone}
    
    Please generate three sections of analysis:
    1. Weekly Patterns - How mood varies across different days of the week
    2. Time of Day - How mood changes throughout the day
    3. Monthly Trends - Overall mood changes compared to previous periods
    
    Format the response as JSON with three keys: weeklyPatterns, timeOfDay, and monthlyTrends.
    Each should contain a natural, personalized insight about the patterns observed.
    Please insure proper punctuation and grammar.`;

    const response = await anthropic.messages.create({
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
      model: 'claude-3-5-sonnet-latest',
    });

    // Get the assistant's response content
    const assistantMessage =
      response.content[0].type === 'text'
        ? response.content[0].text
        : 'No response from AI';
    const analysis = JSON.parse(assistantMessage);

    return analysis;
  });

export const getTriggers = createServerFn({
  method: 'GET',
})
  .validator(MoodSchema)
  .handler(async ({ data: { moods, usersTimeZone } }) => {
    // Prepare the prompt for Claude
    const prompt = `Analyze the following mood data and identify triggers that affect the user's mood:
    Mood entries: ${JSON.stringify(moods)}
    User's timezone: ${usersTimeZone}
    
    Please analyze the notes and mood patterns to identify:
    1. Positive Triggers - Activities, events, or circumstances that are associated with positive moods (happy, excited, calm)
    2. Negative Triggers - Factors that tend to precede or coincide with negative moods (stressed, sad, angry, anxious)
    3. Correlation Analysis - Any notable patterns between activities/circumstances and mood changes
    
    Format the response as JSON with three keys: positiveTriggers, negativeTriggers, and correlationAnalysis.
    Each should contain a natural, personalized insight about the triggers observed.
    Please insure proper punctuation and grammar.`;

    const response = await anthropic.messages.create({
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
      model: 'claude-3-5-sonnet-latest',
    });

    // Get the assistant's response content
    const assistantMessage =
      response.content[0].type === 'text'
        ? response.content[0].text
        : 'No response from AI';
    const analysis = JSON.parse(assistantMessage);

    return analysis;
  });

export const getSuggestions = createServerFn({
  method: 'GET',
})
  .validator(MoodSchema)
  .handler(async ({ data: { moods, usersTimeZone } }) => {
    // Prepare the prompt for Claude
    const prompt = `Analyze the following mood data and generate personalized suggestions for mood improvement:
    Mood entries: ${JSON.stringify(moods)}
    User's timezone: ${usersTimeZone}
    
    Please generate three sections of actionable suggestions:
    1. Mood Improvement - Specific schedule adjustments or habit changes based on observed patterns
    2. Activity Suggestions - Recommended activities based on what has been associated with positive moods
    3. Group/Social Insights - Suggestions related to social interactions and team dynamics if relevant
    
    Format the response as JSON with three keys: moodImprovement, activitySuggestions, and groupInsights.
    Each should contain natural, personalized, and actionable suggestions based on the observed patterns.
    Focus on specific, implementable actions rather than general advice
    Please insure proper punctuation and grammar.`;

    const response = await anthropic.messages.create({
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
      model: 'claude-3-5-sonnet-latest',
    });

    // Get the assistant's response content
    const assistantMessage =
      response.content[0].type === 'text'
        ? response.content[0].text
        : 'No response from AI';
    const analysis = JSON.parse(assistantMessage);

    return analysis;
  });
