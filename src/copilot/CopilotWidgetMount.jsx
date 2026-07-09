import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CopilotKit, useCopilotReadable } from '@copilotkit/react-core';
import { embedTexts, cosineSimilarity } from './embeddingUtils.js';
// useAgent isn't exported from the main "@copilotkit/react-core" entry in
// this version (verified by reading its export list) — only from /v2, even
// though it's the same underlying implementation shared with the v1 runtime
// we render (<CopilotKit> from the main entry, below). It's the only way to
// read/write the actual message history (agent.messages / agent.setMessages);
// useCopilotChat() here has no working setMessages, and its visibleMessages
// was undefined at the point we tried to read it.
import { useAgent } from '@copilotkit/react-core/v2';
import { CopilotChat } from '@copilotkit/react-ui';
import { useGenerativeWidgets } from './GenerativeWidgets.jsx';
import '@copilotkit/react-ui/styles.css';

// Bridges CopilotKit's in-React chat state out to the Vue history drawer,
// since useAgent() can only be called from inside <CopilotKit>.
let bridge = {
  getMessages: () => [],
  setMessages: () => {},
};

const TOP_K_CHUNKS = 5;

function ChatInner({ apiKey, energyStats, deviceStatus, billHistory, weather, pastSessions, knowledgeDocs }) {
  const { agent } = useAgent({ agentId: 'default' });
  const [relevantChunks, setRelevantChunks] = useState([]);

  useGenerativeWidgets();

  // useCopilotReadable populates the request's "context" array (verified via
  // server-side request logging — CopilotChat's own `instructions` prop does
  // NOT reach the runtime in this CopilotKit version, context stayed empty).
  useCopilotReadable({ description: 'Current AC energy usage statistics', value: energyStats });
  useCopilotReadable({ description: 'Current AC device status and settings', value: deviceStatus });
  useCopilotReadable({
    description: 'Saved electricity bill history for this device, loaded from Firestore',
    value: billHistory,
  });
  useCopilotReadable({ description: 'Current outdoor weather conditions', value: weather });
  useCopilotReadable({
    description:
      'Notes and messages from the user\'s previous chat sessions on this device (most recent first). ' +
      'Reference these naturally when relevant, e.g. "You previously mentioned..." — do not ignore ' +
      'things the user already told you in an earlier session.',
    value: pastSessions,
  });
  useCopilotReadable({
    description:
      'Excerpts retrieved from the user\'s uploaded reference documents (manuals, guides, notes) about ' +
      'this AC, ranked by relevance to their current question. Each item has a fileName and text. Use ' +
      'them to answer questions about specific settings, error codes, or maintenance steps — cite the ' +
      'source file name when you do. If empty, no uploaded document was relevant to this question.',
    value: relevantChunks,
  });

  // Runs before the message is added to the agent and before the model is
  // called (verified by reading useCopilotChatInternal's sendMessage in
  // @copilotkit/react-core — it awaits this, then calls agent.addMessage and
  // runAgent). This is a deliberate substitute for a model-invoked search
  // tool: a real search tool needs a follow-up turn to use the tool's
  // result in its answer, and that follow-up is what triggers Gemini's
  // "missing thought_signature" error (same bug documented on the
  // renderBarChart/etc. actions in GenerativeWidgets.jsx). Retrieving here
  // means the excerpts are just part of the request's readable context —
  // no tool call, no follow-up turn, no thought_signature risk.
  const handleSubmitMessage = async (text) => {
    const allChunks = (knowledgeDocs || []).flatMap((doc) =>
      (doc.chunks || []).map((chunk) => ({ fileName: doc.fileName, text: chunk.text, embedding: chunk.embedding }))
    );
    if (!allChunks.length) {
      setRelevantChunks([]);
      return;
    }
    try {
      const [queryEmbedding] = await embedTexts([text], apiKey, 'RETRIEVAL_QUERY');
      const ranked = allChunks
        .map((chunk) => ({ fileName: chunk.fileName, text: chunk.text, similarity: cosineSimilarity(queryEmbedding, chunk.embedding) }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, TOP_K_CHUNKS)
        .map(({ fileName, text: chunkText }) => ({ fileName, text: chunkText }));
      setRelevantChunks(ranked);
    } catch (e) {
      console.error('Knowledge base retrieval failed:', e);
      setRelevantChunks([]);
    }
  };

  useEffect(() => {
    bridge.getMessages = () =>
      (agent?.messages ?? [])
        .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .map((m) => ({ role: m.role === 'user' ? 'user' : 'model', text: m.content }));

    bridge.setMessages = (msgs) => {
      if (!agent) return;
      agent.setMessages(
        (msgs || []).map((m, i) => ({
          id: crypto.randomUUID?.() ?? `restored-${i}`,
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.text,
        }))
      );
    };
  }, [agent, agent?.messages]);

  return (
    <CopilotChat
      labels={{
        title: 'Energy Advisor',
        initial: 'Ask me about your AC energy usage, settings, or past bills...',
      }}
      onSubmitMessage={handleSubmitMessage}
    />
  );
}

function CopilotWidget(props) {
  return (
    <CopilotKit
      runtimeUrl={props.runtimeUrl}
      headers={{ 'x-gemini-api-key': props.apiKey, 'x-gemini-model': props.model }}
    >
      <ChatInner {...props} />
    </CopilotKit>
  );
}

let root = null;

export function mount(container, props) {
  if (!root) root = createRoot(container);
  root.render(<CopilotWidget {...props} />);
}

export function update(props) {
  if (root) root.render(<CopilotWidget {...props} />);
}

export function unmount() {
  if (root) {
    root.unmount();
    root = null;
  }
  bridge = { getMessages: () => [], setMessages: () => {} };
}

export function getMessages() {
  return bridge.getMessages();
}

export function setMessages(msgs) {
  bridge.setMessages(msgs);
}
