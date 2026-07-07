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
});

onMounted(() => {
  mount(mountEl.value, currentProps());
});

watch(
  () => [props.apiKey, props.model, props.runtimeUrl, props.energyStats, props.deviceStatus, props.billHistory, props.weather, props.pastSessions],
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
  min-height: 480px;
  display: flex;
  flex-direction: column;
}
</style>
