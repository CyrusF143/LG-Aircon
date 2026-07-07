import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { CopilotKit, useCopilotReadable } from '@copilotkit/react-core';
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

function ChatInner({ energyStats, deviceStatus, billHistory, weather, pastSessions }) {
  const { agent } = useAgent({ agentId: 'default' });

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
