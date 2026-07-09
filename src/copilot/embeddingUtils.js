// Plain JS (no Vue/React deps) — shared by the Knowledge tab's upload flow
// (src/pages/AIRecommendationsPage.vue) and the chat retrieval flow
// (src/copilot/CopilotWidgetMount.jsx).

const EMBEDDING_MODEL = 'gemini-embedding-001';

// Sliding-window character chunker. Not word-boundary-aware — good enough
// for retrieval, where a chunk split mid-word still embeds close to its
// neighbors.
export function chunkText(text, { size = 1000, overlap = 150 } = {}) {
  if (!text) return [];
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end));
    if (end === text.length) break;
    start = end - overlap;
  }
  return chunks;
}

// Gemini's asymmetric retrieval mode: embed document chunks with
// RETRIEVAL_DOCUMENT and the live question with RETRIEVAL_QUERY for better
// match quality than using the same task type for both.
export async function embedTexts(texts, apiKey, taskType) {
  if (!texts.length) return [];
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:batchEmbedContents`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
      body: JSON.stringify({
        requests: texts.map((text) => ({
          model: `models/${EMBEDDING_MODEL}`,
          content: { parts: [{ text }] },
          taskType
        }))
      })
    }
  );
  if (!res.ok) throw new Error((await res.json()).error?.message || 'Embedding request failed');
  const { embeddings } = await res.json();
  return embeddings.map((e) => e.values);
}

export function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
