# ADR 0009: Focused, bounded guidance retrieval

Status: accepted, 21 November 2026.

## Context

Chat ranked guidance using substring matches and returned up to four positive matches. A question about mask fit could include filter maintenance or pets; `car` could match `carbon`. Such citations were real library entries, but their presence did not establish relevance to the user's question.

## Decision

Move retrieval into `src/lib/guidance-retrieval.ts`, leaving urgent routing and response formatting in `chat-guidance.ts`. Build Unicode-normalized token sets once for the curated corpus. Match whole words, with a small explicit map for supported English plurals, fit variants, Hindi smoke spellings and the Hindi bus term. Preserve CO as a meaningful short token. Do not use unrestricted stemming or fuzzy substring matches.

Bound questions to 800 characters before normalization. Deduplicate terms and ignore common question words. Keep only candidates with the highest number of matched query terms, then use identifier/title matches and original corpus order to resolve ties. Return at most four entries without sorting or mutating the corpus itself. A question with no supported term gets the existing honest no-grounded-information reply.

This changes chat retrieval only. The guidance library keeps its existing partial-text browsing behavior. Urgent routing and all underlying safety guidance, citations and quantitative calculations remain unchanged. No new runtime dependency or model call is required.

## Evidence and limits

`tests/retrieval-quality.test.ts` specifies expected leading references and excluded tangential references independently of the index implementation. It covers focused English/Hindi questions, word boundaries, plurals, short terms, empty/unknown input, repetition, hidden characters, size limits and stable bounded output. Desktop/mobile journeys check actual rendered citations, Hindi switching, unknown-question recovery and distinction between car and carbon.

`reports/retrieval-quality.json` compares the previous committed retriever with this one on explicitly listed regression cases. This is targeted software evidence, not a general precision/recall benchmark, medical validation or predicted judging score. Matching remains lexical: unsupported synonyms, typos and ambiguous questions can still need rephrasing. Strongest term coverage is a ranking rule, not calibrated semantic confidence.
