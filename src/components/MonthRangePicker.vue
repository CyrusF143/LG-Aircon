<template>
  <div class="month-range-picker">
    <div class="month-range-picker-header">
      <q-btn @click="changeYear(false)" dense flat round icon="navigate_before" />
      <span class="text-subtitle2 text-weight-medium">{{ viewYear }}</span>
      <q-btn @click="changeYear(true)" dense flat round icon="navigate_next" />
    </div>

    <div class="month-range-picker-hint text-caption text-grey-6 q-mb-xs text-center">
      {{ selecting === 'from' ? 'Select start month' : 'Select end month' }}
    </div>

    <div class="month-range-picker-months">
      <button
        v-for="month in displayedMonths"
        :key="month.getTime()"
        class="month-btn"
        :class="{
          'month-current': isCurrentMonth(month),
          'month-start': isStart(month),
          'month-end': isEnd(month),
          'month-in-range': isInRange(month),
        }"
        @click="selectMonth(month)"
      >
        {{ month.toLocaleDateString([], { month: 'short' }) }}
      </button>
    </div>

    <div v-if="from || to" class="text-caption text-grey-7 q-mt-sm text-center">
      {{ from ? fmtDisplay(from) : '?' }} – {{ to ? fmtDisplay(to) : '?' }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: { default: null }
});
const emit = defineEmits(['update:modelValue']);

const viewYear = ref(new Date().getFullYear());
const selecting = ref('from');
const from = ref(null);
const to = ref(null);

const clean = (d) => {
  const c = new Date(d);
  c.setDate(1); c.setHours(0, 0, 0, 0);
  return c;
};

const fmtDisplay = (d) =>
  `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;

const displayedMonths = computed(() => {
  const months = [];
  for (let i = 0; i < 12; i++) months.push(new Date(viewYear.value, i, 1));
  return months;
});

const isCurrentMonth = (m) => {
  const now = clean(new Date());
  return m.getTime() === now.getTime();
};
const isStart = (m) => from.value && m.getTime() === from.value.getTime();
const isEnd = (m) => to.value && m.getTime() === to.value.getTime();
const isInRange = (m) =>
  from.value && to.value &&
  m.getTime() > from.value.getTime() &&
  m.getTime() < to.value.getTime();

const changeYear = (up) => { viewYear.value += up ? 1 : -1; };

const selectMonth = (month) => {
  const m = clean(month);
  if (selecting.value === 'from') {
    from.value = m;
    to.value = null;
    selecting.value = 'to';
  } else {
    if (m < from.value) {
      // clicked before from — restart
      from.value = m;
      to.value = null;
    } else {
      to.value = m;
      selecting.value = 'from';
      emit('update:modelValue', { from: from.value, to: to.value });
    }
  }
};

watch(() => props.modelValue, (val) => {
  if (val?.from && val?.to) {
    from.value = clean(val.from);
    to.value = clean(val.to);
    viewYear.value = from.value.getFullYear();
    selecting.value = 'from';
  }
}, { immediate: true });
</script>

<style scoped>
.month-range-picker {
  width: 260px;
  user-select: none;
}
.month-range-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.month-range-picker-months {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
.month-btn {
  width: 30%;
  margin: 3px 0;
  padding: 7px 0;
  border: none;
  border-radius: 20px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.15s, color 0.15s;
}
.month-btn:hover {
  background: rgba(25, 118, 210, 0.12);
}
.month-current {
  font-weight: bold;
  color: #1976d2;
}
.month-start,
.month-end {
  background: #1976d2 !important;
  color: #fff !important;
  font-weight: bold;
}
.month-in-range {
  background: rgba(25, 118, 210, 0.15);
  color: #1976d2;
}
</style>
