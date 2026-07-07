import express from 'express';
import cors from 'cors';
import { CopilotRuntime, copilotRuntimeNodeExpressEndpoint } from '@copilotkit/runtime';
// BuiltInAgent is only exported from the /v2 subpath in this version, even
// though the v1 CopilotRuntime (imported above) accepts it via `agents`.
import { BuiltInAgent } from '@copilotkit/runtime/v2';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Mounted with no path prefix (not app.use('/api/copilotkit', ...)) because
// Express rewrites req.url to be relative to the mount path for path-scoped
// middleware, but the CopilotKit handler reconstructs the request URL itself
// and matches it against the full "/api/copilotkit" basePath internally —
// a stripped req.url makes every request 404 inside the handler.
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/copilotkit')) return next();

  const apiKey = req.header('x-gemini-api-key');
  const model = req.header('x-gemini-model') || 'gemini-flash-latest';

  if (!apiKey) {
    res.status(400).json({ error: 'Missing x-gemini-api-key header' });
    return;
  }

  const runtime = new CopilotRuntime({
    agents: {
      // toolChoice defaults to 'auto' — needed so the model can call the
      // renderBarChart/renderLineChart/renderPieChart/renderTable tools
      // (defined client-side in src/copilot/GenerativeWidgets.jsx). The
      // `prompt` below is the one channel confirmed (via request logging)
      // to actually reach the model in this CopilotKit version — it steers
      // the model away from misusing BuiltInAgent's own always-injected
      // AGUISendStateSnapshot/Delta tools, which are for generative-UI state
      // sync and unrelated to answering the user.
      default: new BuiltInAgent({
        model: `google/${model}`,
        apiKey,
        // Gemini's "thinking" models require a thoughtSignature on every
        // function call to preserve reasoning context across turns. The AI
        // SDK's automatic workaround for a missing signature only kicks in
        // for models literally named "gemini-3.x", not for the "-latest"
        // aliases we offer in Settings (which currently resolve to a
        // thinking-enabled model) — so tool calls failed outright. We don't
        // need extended thinking for Q&A/widget rendering, so disable it.
        providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } },
        prompt:
          'You are a friendly AC energy advisor. When presenting data that fits a chart or table ' +
          '(comparisons, trends, breakdowns, or more than ~4 columns), call the matching rendering tool ' +
          '(renderBarChart, renderLineChart, renderPieChart, or renderTable) with the data. Otherwise ' +
          'just answer in plain text. ' +
          'MANDATORY RULE, NO EXCEPTIONS: every single response that calls a rendering tool MUST also ' +
          'contain written text in that exact same response — never a tool call by itself with empty or ' +
          'missing text. Structure it as: (1) first, 1-3 sentences of plain text summarizing the key ' +
          'insight or calling out the most important number, THEN (2) the tool call with the data. ' +
          'You get exactly one turn — there is no follow-up turn where you could add commentary after ' +
          'the widget renders, so the text must be written now, alongside the tool call, every time, ' +
          'with no exceptions. A response with a chart/table and no text is considered a mistake. ' +
          'Never call AGUISendStateSnapshot or AGUISendStateDelta — those are unrelated to answering the user.',
      })
    }
  });

  const handleRequest = copilotRuntimeNodeExpressEndpoint({
    runtime,
    endpoint: '/api/copilotkit'
  });

  handleRequest(req, res).catch(next);
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`CopilotKit runtime listening on port ${port}`);
});
