<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" @hide="onDialogHide">
    <q-card class="bill-calculator-card">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">
          <q-icon name="attach_money" class="q-mr-sm" />
          Calculate Electricity Bill
        </div>
      </q-card-section>
      <q-card-section class="q-pt-md">
        <q-input v-model.number="billCalc.totalAmountDue" label="Household Total Amount Due" type="number" outlined prefix="₱" :rules="[val => val > 0 || 'Must be greater than 0']" class="q-mb-md">
          <template v-slot:prepend><q-icon name="receipt" /></template>
        </q-input>
        <q-input v-model.number="billCalc.totalKwhUsed" label="Household Total kWh Used" type="number" outlined suffix="kWh" :rules="[val => val > 0 || 'Must be greater than 0']" class="q-mb-md">
          <template v-slot:prepend><q-icon name="bolt" /></template>
        </q-input>

        <!-- Result Display -->
        <div ref="billResultRef">
          <q-card v-if="calculatedBill" flat bordered class="bg-blue-1 q-pa-md">
            <div class="text-subtitle2 text-grey-8 q-mb-xs">AC Device Usage Cost</div>
            <div class="text-caption text-grey-6 q-mb-sm">
              <q-icon name="date_range" size="xs" class="q-mr-xs" />
              {{ displayDateRange }}
            </div>

            <!-- Household inputs summary -->
            <div class="row q-col-gutter-sm q-mb-sm">
              <div class="col-6">
                <div class="text-caption text-grey-7">Household Amount Due</div>
                <div class="text-body2 text-weight-medium">₱{{ billCalc.totalAmountDue?.toLocaleString() }}</div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey-7">Household Total kWh</div>
                <div class="text-body2 text-weight-medium">{{ billCalc.totalKwhUsed?.toLocaleString() }} kWh</div>
              </div>
            </div>

            <div class="row items-center justify-between">
              <div>
                <div class="text-caption text-grey-7">Rate per kWh</div>
                <div class="text-body1 text-weight-medium">₱{{ ratePerKwh }}</div>
              </div>
              <div>
                <div class="text-caption text-grey-7">Device Total kWh</div>
                <div class="text-body1 text-weight-medium">{{ energyStats?.total || '0.00' }} kWh</div>
              </div>
            </div>
            <q-separator class="q-my-md" />
            <div class="text-center">
              <div class="text-caption text-grey-7">Your AC Electricity Cost</div>
              <div class="text-h4 text-positive text-weight-bold">₱{{ calculatedBill }}</div>
              <div class="text-caption text-grey-6">for the selected period</div>
            </div>
          </q-card>
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Close" color="grey" v-close-popup />
        <q-btn
          v-if="!calculatedBill"
          label="Calculate"
          color="primary"
          icon="calculate"
          @click="calculateBill"
          :disable="!billCalc.totalAmountDue || !billCalc.totalKwhUsed || !energyStats"
        />
        <q-btn
          v-else
          label="Save as Image"
          color="positive"
          icon="save_alt"
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

    // Download locally
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();

    $q.notify({ type: 'positive', message: 'Image downloaded! Saving to cloud...', icon: 'download' });

    // Save to Firestore — keep loading until done
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
  width: 90vw;
  max-width: 480px;
}
</style>
