import { useCopilotAction } from '@copilotkit/react-core';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

// Fixed categorical order (never cycled/reassigned) — see dataviz skill palette.
const CATEGORICAL = ['#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7', '#e34948', '#e87ba4', '#eb6834'];

const wrapperStyle = {
  '--surface-1': '#fcfcfb',
  '--text-primary': '#0b0b0b',
  '--text-secondary': '#52514e',
  '--muted': '#898781',
  '--gridline': '#e1e0d9',
  '--baseline': '#c3c2b7',
  background: 'var(--surface-1)',
  border: '1px solid rgba(11,11,11,0.10)',
  borderRadius: 12,
  padding: '14px 16px',
  margin: '4px 0',
  fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
};

const titleStyle = {
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--text-primary)',
  marginBottom: 10,
};

function Title({ children }) {
  if (!children) return null;
  return <div style={titleStyle}>{children}</div>;
}

// Collapse anything past the 8-slot categorical order into "Other" so color
// assignment never falls back to a generated/cycled hue.
function withOtherBucket(data) {
  if (!Array.isArray(data) || data.length <= CATEGORICAL.length) return data ?? [];
  const head = data.slice(0, CATEGORICAL.length - 1);
  const restTotal = data.slice(CATEGORICAL.length - 1).reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  return [...head, { label: 'Other', value: restTotal }];
}

export function BarChartWidget({ title, data, xLabel, yLabel }) {
  const rows = withOtherBucket(data);
  return (
    <div style={wrapperStyle}>
      <Title>{title}</Title>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--gridline)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--muted)' }}
            axisLine={{ stroke: 'var(--baseline)' }}
            tickLine={false}
            label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -2, fontSize: 11, fill: 'var(--muted)' } : undefined}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--muted)' }}
            axisLine={false}
            tickLine={false}
            width={40}
            label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--muted)' } : undefined}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--gridline)' }}
            cursor={{ fill: 'rgba(11,11,11,0.04)' }}
          />
          <Bar dataKey="value" fill={CATEGORICAL[0]} radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LineChartWidget({ title, data, xLabel, yLabel }) {
  return (
    <div style={wrapperStyle}>
      <Title>{title}</Title>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data ?? []} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--gridline)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--muted)' }}
            axisLine={{ stroke: 'var(--baseline)' }}
            tickLine={false}
            label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -2, fontSize: 11, fill: 'var(--muted)' } : undefined}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--muted)' }}
            axisLine={false}
            tickLine={false}
            width={40}
            label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--muted)' } : undefined}
          />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--gridline)' }} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={CATEGORICAL[0]}
            strokeWidth={2}
            dot={{ r: 4, fill: CATEGORICAL[0] }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PieChartWidget({ title, data }) {
  const rows = withOtherBucket(data);
  const showLegend = rows.length >= 2;
  return (
    <div style={wrapperStyle}>
      <Title>{title}</Title>
      <ResponsiveContainer width="100%" height={showLegend ? 260 : 220}>
        <PieChart>
          <Pie
            data={rows}
            dataKey="value"
            nameKey="label"
            innerRadius="45%"
            outerRadius="80%"
            paddingAngle={2}
            stroke="var(--surface-1)"
            strokeWidth={2}
            label={({ percent }) => `${Math.round(percent * 100)}%`}
            labelLine={false}
          >
            {rows.map((entry, i) => (
              <Cell key={entry.label ?? i} fill={CATEGORICAL[i % CATEGORICAL.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--gridline)' }} />
          {showLegend && <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TableWidget({ title, columns, rows }) {
  const cols = columns ?? [];
  const data = (rows ?? []).map((r) => r?.cells ?? r);
  return (
    <div style={wrapperStyle}>
      <Title>{title}</Title>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {cols.map((c) => (
                <th
                  key={c}
                  style={{
                    textAlign: 'left',
                    padding: '6px 10px',
                    borderBottom: '1px solid var(--baseline)',
                    color: 'var(--text-secondary)',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 1 ? 'rgba(11,11,11,0.03)' : 'transparent' }}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    style={{
                      padding: '6px 10px',
                      borderBottom: '1px solid var(--gridline)',
                      color: 'var(--text-primary)',
                      fontVariantNumeric: 'tabular-nums',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const dataPointParam = (description) => ({
  name: 'data',
  type: 'object[]',
  description,
  attributes: [
    { name: 'label', type: 'string', description: 'Category label (e.g. a date range or day)' },
    { name: 'value', type: 'number', description: 'Numeric value for this category' },
  ],
});

// Registers the generative-UI tools the model can call to render a widget
// instead of (or alongside) a text answer. Must run inside <CopilotKit>.
export function useGenerativeWidgets() {
  useCopilotAction({
    name: 'renderBarChart',
    description:
      'Render a bar chart to compare a numeric value (e.g. kWh usage, bill amount) across categories such as billing periods or days. Use when the user asks to compare or visualize values across multiple items.',
    parameters: [
      { name: 'title', type: 'string', description: 'Chart title' },
      dataPointParam('Data points to plot as bars'),
      { name: 'xLabel', type: 'string', description: 'X axis label', required: false },
      { name: 'yLabel', type: 'string', description: 'Y axis label', required: false },
    ],
    handler: async () => ({ success: true }),
    // Skip the automatic post-tool-call follow-up request to the model: the
    // rendered widget is the complete answer, and that follow-up replay is
    // what triggers Gemini's "missing thoughtSignature" error (it resends
    // the function-call message from this turn without the signature the
    // model attached, since that metadata isn't threaded through here).
    followUp: false,
    render: ({ args }) => <BarChartWidget {...args} />,
  });

  useCopilotAction({
    name: 'renderLineChart',
    description:
      'Render a line chart to show a trend over time or sequence (e.g. daily usage trend across a billing period). Use when the user asks about trends, changes over time, or patterns.',
    parameters: [
      { name: 'title', type: 'string', description: 'Chart title' },
      dataPointParam('Data points to plot along the line, in sequence order'),
      { name: 'xLabel', type: 'string', description: 'X axis label', required: false },
      { name: 'yLabel', type: 'string', description: 'Y axis label', required: false },
    ],
    handler: async () => ({ success: true }),
    // Skip the automatic post-tool-call follow-up request to the model: the
    // rendered widget is the complete answer, and that follow-up replay is
    // what triggers Gemini's "missing thoughtSignature" error (it resends
    // the function-call message from this turn without the signature the
    // model attached, since that metadata isn't threaded through here).
    followUp: false,
    render: ({ args }) => <LineChartWidget {...args} />,
  });

  useCopilotAction({
    name: 'renderPieChart',
    description:
      'Render a pie/donut chart to show how a total splits into parts (e.g. share of usage across periods). Use when the user asks for a breakdown or proportion, not for comparing raw magnitudes (use a bar chart for that).',
    parameters: [
      { name: 'title', type: 'string', description: 'Chart title' },
      dataPointParam('Data points representing each slice'),
    ],
    handler: async () => ({ success: true }),
    // Skip the automatic post-tool-call follow-up request to the model: the
    // rendered widget is the complete answer, and that follow-up replay is
    // what triggers Gemini's "missing thoughtSignature" error (it resends
    // the function-call message from this turn without the signature the
    // model attached, since that metadata isn't threaded through here).
    followUp: false,
    render: ({ args }) => <PieChartWidget {...args} />,
  });

  useCopilotAction({
    name: 'renderTable',
    description:
      'Render a styled data table. Prefer this over a plain markdown table when the user explicitly asks for a table, or when showing more than ~4 columns.',
    parameters: [
      { name: 'title', type: 'string', description: 'Table title', required: false },
      { name: 'columns', type: 'string[]', description: 'Column headers, in order' },
      {
        name: 'rows',
        type: 'object[]',
        description: 'Table rows, in order',
        attributes: [
          {
            name: 'cells',
            type: 'string[]',
            description: 'Cell values (as strings) for this row, matching the columns order',
          },
        ],
      },
    ],
    handler: async () => ({ success: true }),
    // Skip the automatic post-tool-call follow-up request to the model: the
    // rendered widget is the complete answer, and that follow-up replay is
    // what triggers Gemini's "missing thoughtSignature" error (it resends
    // the function-call message from this turn without the signature the
    // model attached, since that metadata isn't threaded through here).
    followUp: false,
    render: ({ args }) => <TableWidget {...args} />,
  });
}
