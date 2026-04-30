<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" @hide="onDialogHide">
    <q-card class="bill-calculator-card">

      <!-- Header -->
      <div class="modal-header">
        <div class="header-icon-wrap">
          <q-icon name="bolt" size="28px" color="white" />
        </div>
        <div>
          <div class="text-h6 text-white text-weight-bold">Calculate Electricity Bill</div>
          <div class="text-caption text-blue-2 date-range-header" v-if="displayDateRange">
            <q-icon name="date_range" size="12px" class="q-mr-xs" />{{ displayDateRange }}
          </div>
          <div class="text-caption text-blue-2" v-else>Estimate your AC energy cost</div>
        </div>
        <q-space />
        <q-btn flat round dense icon="close" color="white" v-close-popup />
      </div>

      <q-card-section class="q-pt-lg q-pb-sm q-px-lg" style="overflow-y: auto; flex: 1;">

        <!-- Input fields -->
        <div v-if="!calculatedBill" class="input-group q-mb-md">
          <div class="input-label">
            <q-icon name="receipt_long" size="16px" class="q-mr-xs text-primary" />
            Household Total Amount Due
          </div>
          <q-input
            v-model.number="billCalc.totalAmountDue"
            type="number"
            outlined
            dense
            prefix="₱"
            placeholder="0.00"
            :rules="[val => !val || val > 0 || 'Must be greater than 0']"
            class="styled-input"
            hide-bottom-space
          />
        </div>

        <div v-if="!calculatedBill" class="input-group q-mb-lg">
          <div class="input-label">
            <q-icon name="electric_meter" size="16px" class="q-mr-xs text-primary" />
            Household Total kWh Used
          </div>
          <q-input
            v-model.number="billCalc.totalKwhUsed"
            type="number"
            outlined
            dense
            suffix="kWh"
            placeholder="0.00"
            :rules="[val => !val || val > 0 || 'Must be greater than 0']"
            class="styled-input"
            hide-bottom-space
          />
        </div>

        <!-- Result Display -->
        <transition name="slide-fade">
          <div ref="billResultRef" v-if="calculatedBill">
            <div class="result-card">

              <!-- Card header -->
              <div class="result-card-header">
                <div>
                  <div class="result-title">AC Device Usage Cost</div>
                  <div class="result-date">
                    <q-icon name="date_range" size="13px" class="q-mr-xs" />{{ displayDateRange }}
                  </div>
                </div>
                <q-icon name="electric_bolt" size="28px" color="primary" class="result-icon" />
              </div>

              <!-- 4-stat grid -->
              <div class="stat-grid">
                <div class="stat-chip">
                  <div class="stat-chip-label">Household Amount Due</div>
                  <div class="stat-chip-value blue">₱{{ billCalc.totalAmountDue?.toLocaleString() }}</div>
                </div>
                <div class="stat-chip">
                  <div class="stat-chip-label">Household Total kWh</div>
                  <div class="stat-chip-value blue">{{ billCalc.totalKwhUsed?.toLocaleString() }} kWh</div>
                </div>
                <div class="stat-chip">
                  <div class="stat-chip-label">Rate per kWh</div>
                  <div class="stat-chip-value teal">₱{{ ratePerKwh }}</div>
                </div>
                <div class="stat-chip">
                  <div class="stat-chip-label">Device Total kWh</div>
                  <div class="stat-chip-value teal">{{ energyStats?.total || '0.00' }} kWh</div>
                </div>
              </div>

              <!-- Cost result -->
              <div class="result-cost-section">
                <div class="result-cost-label">YOUR AC ELECTRICITY COST</div>
                <div class="result-amount">₱{{ calculatedBill }}</div>
                <div class="result-sub">for the selected period</div>
              </div>

            </div>
          </div>
        </transition>
      </q-card-section>

      <!-- Actions -->
      <q-separator />
      <q-card-actions class="q-px-lg q-pb-lg q-pt-md" align="right">
        <q-btn v-if="!calculatedBill" flat label="Close" color="grey-7" class="q-mr-xs" v-close-popup />
        <q-btn v-else flat label="Recalculate" color="primary" icon="refresh" class="q-mr-xs" @click="calculatedBill = null; ratePerKwh = null" />
        <q-btn
          v-if="!calculatedBill"
          label="Calculate"
          color="primary"
          icon="calculate"
          unelevated
          class="action-btn"
          @click="calculateBill"
          :disable="!billCalc.totalAmountDue || !billCalc.totalKwhUsed || !energyStats"
        />
        <q-btn
          v-else
          label="Save as Image"
          color="positive"
          icon="save_alt"
          unelevated
          class="action-btn"
          @click="saveAsImage"
          :loading="savingImage"
        />
      </q-card-actions>

    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { auth, firestore } from 'src/boot/firebase';
import { collection, addDoc } from 'firebase/firestore';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  energyStats: {
    type: Object,
    default: null
  },
  displayDateRange: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);

const $q = useQuasar();

const billCalc = ref({ totalAmountDue: null, totalKwhUsed: null });
const calculatedBill = ref(null);
const ratePerKwh = ref(null);
const savingImage = ref(false);
const billResultRef = ref(null);

const onDialogHide = () => {
  calculatedBill.value = null;
  ratePerKwh.value = null;
  billCalc.value = { totalAmountDue: null, totalKwhUsed: null };
};

const calculateBill = () => {
  if (!billCalc.value.totalAmountDue || !billCalc.value.totalKwhUsed || !props.energyStats) {
    $q.notify({ type: 'warning', message: 'Please fill in all fields', icon: 'warning' });
    return;
  }
  ratePerKwh.value = (billCalc.value.totalAmountDue / billCalc.value.totalKwhUsed).toFixed(2);
  calculatedBill.value = (ratePerKwh.value * parseFloat(props.energyStats.total)).toFixed(2);
  $q.notify({ type: 'positive', message: 'Bill calculated successfully!', icon: 'check_circle' });
};

const saveAsImage = async () => {
  if (!billResultRef.value) return;
  savingImage.value = true;

  try {
    if (!window.html2canvas) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    const canvas = await window.html2canvas(billResultRef.value, {
      backgroundColor: '#ffffff',
      scale: 2
    });

    const dataUrl = canvas.toDataURL('image/png');
    const filename = `AC-Bill-${props.displayDateRange.replace(/\//g, '-').replace(' – ', '_to_')}.png`;

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();

    $q.notify({ type: 'positive', message: 'Image downloaded! Saving to cloud...', icon: 'download' });

    const uid = auth.currentUser?.uid;
    if (uid) {
      await addDoc(collection(firestore, 'users', uid, 'bills'), {
        dateRange: props.displayDateRange,
        householdAmountDue: billCalc.value.totalAmountDue,
        householdTotalKwh: billCalc.value.totalKwhUsed,
        ratePerKwh: parseFloat(ratePerKwh.value),
        deviceTotalKwh: parseFloat(props.energyStats.total),
        avgKwhPerDay: parseFloat(props.energyStats.average),
        daysActive: props.energyStats.daysActive,
        peakDayKwh: parseFloat(props.energyStats.maxDayKwh),
        calculatedBill: parseFloat(calculatedBill.value),
        savedAt: new Date().toISOString()
      });
      $q.notify({ type: 'info', message: 'Bill record saved to cloud!', icon: 'cloud_done' });
      emit('update:modelValue', false);
    }

  } catch (err) {
    $q.notify({ type: 'negative', message: `Error: ${err.message}`, icon: 'error' });
  } finally {
    savingImage.value = false;
  }
};
</script>

<style scoped>
.bill-calculator-card {
  width: 92vw;
  max-width: 460px;
  border-radius: 16px !important;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 92vh;
}

/* Header */
.modal-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 20px 20px 24px;
  background: linear-gradient(135deg, #1565c0 0%, #1976d2 60%, #1e88e5 100%);
}

.header-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.18);
  flex-shrink: 0;
}

/* Inputs */
.input-label {
  font-size: 12px;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
}

.styled-input :deep(.q-field__control) {
  border-radius: 10px;
  background: #f7f9fc;
}

/* Result card */
.result-card {
  border-radius: 16px;
  background: linear-gradient(145deg, #f0f7ff 0%, #f0fff4 100%);
  border: 1.5px solid #90caf9;
  padding: 18px 18px 16px;
  overflow: hidden;
}

.result-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
}

.result-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 3px;
}

.result-date {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #777;
}

.result-icon {
  opacity: 0.2;
}

/* 4-stat grid */
.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}

.stat-chip {
  background: white;
  border-radius: 10px;
  padding: 10px 12px;
  border: 1px solid #e3eaf5;
}

.stat-chip-label {
  font-size: 11px;
  color: #888;
  font-weight: 500;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.stat-chip-value {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-chip-value.blue { color: #1565c0; }
.stat-chip-value.teal { color: #00796b; }

/* Cost result */
.result-cost-section {
  background: white;
  border-radius: 12px;
  border: 1px solid #c8e6c9;
  text-align: center;
  padding: 14px 12px 12px;
}

.result-cost-label {
  font-size: 11px;
  font-weight: 600;
  color: #888;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.result-amount {
  font-size: 2.8rem;
  font-weight: 800;
  color: #2e7d32;
  line-height: 1.1;
  letter-spacing: -1.5px;
}

.result-sub {
  font-size: 11px;
  color: #aaa;
  margin-top: 4px;
}

/* Action btn */
.action-btn {
  border-radius: 8px;
  padding: 6px 20px;
  font-weight: 600;
}

/* Transition */
.slide-fade-enter-active {
  transition: all 0.3s ease;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
</style>
