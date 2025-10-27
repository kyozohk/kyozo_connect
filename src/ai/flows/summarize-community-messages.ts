'use server';

/**
 * @fileOverview Summarizes community message threads.
 *
 * - summarizeCommunityMessages - A function that summarizes messages from a given community.
 * - SummarizeCommunityMessagesInput - The input type for the summarizeCommunityMessages function.
 * - SummarizeCommunityMessagesOutput - The return type for the summarizeCommunityMessages function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeCommunityMessagesInputSchema = z.object({
  communityId: z.string().describe('The ID of the community to summarize messages from.'),
  userId: z.string().describe('The ID of the user requesting the summary.'),
  messages: z.array(
    z.object({
      sender: z.string(),
      text: z.string(),
    })
  ).describe('The messages from the community.'),
});

export type SummarizeCommunityMessagesInput = z.infer<typeof SummarizeCommunityMessagesInputSchema>;

const SummarizeCommunityMessagesOutputSchema = z.object({
  summary: z.string().describe('A summary of the messages in the community.'),
});

export type SummarizeCommunityMessagesOutput = z.infer<typeof SummarizeCommunityMessagesOutputSchema>;

export async function summarizeCommunityMessages(input: SummarizeCommunityMessagesInput): Promise<SummarizeCommunityMessagesOutput> {
  return summarizeCommunityMessagesFlow(input);
}

const summarizeCommunityMessagesPrompt = ai.definePrompt({
  name: 'summarizeCommunityMessagesPrompt',
  input: {schema: SummarizeCommunityMessagesInputSchema},
  output: {schema: SummarizeCommunityMessagesOutputSchema},
  prompt: `You are an expert community moderator.  Your job is to summarize community message threads so users can quickly understand what the community is talking about.

  Summarize the following messages for user {{userId}} in community {{communityId}}:

  {{#each messages}}
  Sender: {{sender}}
  Message: {{text}}
  {{/each}}
  `,
});

const summarizeCommunityMessagesFlow = ai.defineFlow(
  {
    name: 'summarizeCommunityMessagesFlow',
    inputSchema: SummarizeCommunityMessagesInputSchema,
    outputSchema: SummarizeCommunityMessagesOutputSchema,
  },
  async input => {
    const {output} = await summarizeCommunityMessagesPrompt(input);
    return output!;
  }
);
