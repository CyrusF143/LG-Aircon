<template>
  <div ref="mountEl" class="copilot-mount-root"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { mount, update, unmount, getMessages, setMessages } from 'src/copilot/CopilotWidgetMount.jsx';

const props = defineProps({
  apiKey: { type: String, default: '' },
  model: { type: String, default: '' },
  runtimeUrl: { type: String, default: '' },
  energyStats: { type: Object, default: null },
  deviceStatus: { type: Object, default: null },
  billHistory: { type: Array, default: () => [] },
  weather: { type: Object, default: null },
  pastSessions: { type: Array, default: () => [] },
  knowledgeDocs: { type: Array, default: () => [] },
});

const mountEl = ref(null);

const currentProps = () => ({
  runtimeUrl: props.runtimeUrl,
  apiKey: props.apiKey,
  model: props.model,
  energyStats: props.energyStats,
  deviceStatus: props.deviceStatus,
  billHistory: props.billHistory,
  weather: props.weather,
  pastSessions: props.pastSessions,
  knowledgeDocs: props.knowledgeDocs,
});

onMounted(() => {
  mount(mountEl.value, currentProps());
});

watch(
  () => [props.apiKey, props.model, props.runtimeUrl, props.energyStats, props.deviceStatus, props.billHistory, props.weather, props.pastSessions, props.knowledgeDocs],
  () => update(currentProps())
);

onUnmounted(() => {
  unmount();
});

defineExpose({
  saveHistory: () => getMessages(),
  loadHistory: (messages) => setMessages(messages),
});
</script>

<style scoped>
.copilot-mount-root {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* CopilotKit ships .copilotKitChat with its `height: 100%` rule commented
   out (it assumes the popup/sidebar .copilotKitWindow wrapper sizes it
   instead). Mounted standalone here, that leaves it unsized, so its
   flex-grow message list has nothing to grow into and the input bar ends
   up stranded with a big empty gap below it. Force the fill ourselves. */
.copilot-mount-root :deep(.copilotKitChat) {
  height: 100%;
  flex: 1 1 auto;
  min-height: 0;
}
</style>
