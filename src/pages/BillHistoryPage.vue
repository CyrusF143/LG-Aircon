<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-md">

      <!-- Header -->
      <q-card class="bg-primary text-white">
        <q-card-section>
          <div class="row items-center">
            <q-btn flat dense round icon="arrow_back" @click="goBack" class="q-mr-md" />
            <div>
              <div class="text-h5">
                <q-icon name="receipt_long" size="sm" class="q-mr-sm" />
                Bill History
              </div>
              <div class="text-subtitle2">Saved electricity bill records</div>
            </div>
            <q-space />
            <ProfileMenu />
          </div>
        </q-card-section>
      </q-card>

      <!-- Loading -->
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner size="50px" color="primary" />
        <div class="q-mt-md text-grey-7">Loading bill history...</div>
      </div>

      <!-- Empty State -->
      <div v-else-if="bills.length === 0" class="text-center q-pa-xl text-grey-7">
        <q-icon name="receipt_long" size="64px" color="grey-4" />
        <div class="q-mt-md text-h6">No saved bills yet</div>
        <div class="text-caption">Bills saved from the calculator will appear here</div>
      </div>

      <!-- Total Summary -->
      <q-card v-else flat bordered class="bg-green-1">
        <q-card-section class="q-pa-sm text-center">
          <div class="text-caption text-grey-7">Total AC Electricity Cost (All Records)</div>
          <div class="text-h4 text-positive text-weight-bold">
            ₱{{ totalBill }}
          </div>
        </q-card-section>
      </q-card>

      <!-- View Toggle -->
      <div v-if="bills.length > 0" class="row items-center justify-between">
        <div class="text-subtitle2 text-grey-7">{{ bills.length }} record{{ bills.length > 1 ? 's' : '' }}</div>
        <q-btn-toggle
          v-model="viewMode"
          toggle-color="primary"
          :options="[
            { label: 'List', value: 'list', icon: 'list' },
            { label: 'Card', value: 'card', icon: 'grid_view' },
            { label: 'Chart', value: 'chart', icon: 'bar_chart' }
          ]"
          size="sm" dense unelevated
        />
      </div>

      <!-- List View -->
      <div v-if="bills.length > 0 && viewMode === 'list'">
        <q-list bordered separator>
          <q-item v-for="bill in bills" :key="bill.id" class="q-py-sm">
            <q-item-section>
              <q-item-label class="text-caption text-grey-7">
                <q-icon name="date_range" size="xs" class="q-mr-xs" />{{ bill.dateRange }}
              </q-item-label>
              <q-item-label class="text-caption text-grey-5">{{ formatSavedAt(bill.savedAt) }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <div class="text-right">
                <div class="text-h6 text-positive text-weight-bold">₱{{ bill.calculatedBill?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
                <div class="text-caption text-grey-6">{{ bill.deviceTotalKwh }} kWh · {{ bill.daysActive }} days</div>
              </div>
            </q-item-section>
            <q-item-section side>
              <q-btn flat round dense icon="delete" color="negative" size="sm" @click="confirmDelete(bill)" />
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <!-- Card View -->
      <div v-if="bills.length > 0 && viewMode === 'card'" class="overflow-hidden">
        <div class="row q-col-gutter-md justify-center">
          <div v-for="bill in bills" :key="bill.id" class="col-12 col-sm-6 col-md-4">
            <q-card flat bordered class="bill-card">
              <q-card-section class="bg-blue-1 q-pa-sm">
                <div class="row items-center">
                  <q-icon name="date_range" size="xs" color="grey-7" class="q-mr-xs" />
                  <span class="text-caption text-grey-7">{{ bill.dateRange }}</span>
                  <q-space />
                  <span class="text-caption text-grey-5">{{ formatSavedAt(bill.savedAt) }}</span>
                </div>
              </q-card-section>
              <q-card-section class="q-pa-md">
                <div class="text-center q-mb-md">
                  <div class="text-caption text-grey-7">AC Electricity Cost</div>
                  <div class="text-h4 text-positive text-weight-bold">₱{{ bill.calculatedBill?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
                </div>
                <q-separator class="q-mb-md" />
                <div class="row q-col-gutter-sm">
                  <div class="col-6">
                    <div class="text-caption text-grey-6">Household Amount Due</div>
                    <div class="text-body2 text-weight-medium">₱{{ bill.householdAmountDue?.toLocaleString() }}</div>
                  </div>
                  <div class="col-6">
                    <div class="text-caption text-grey-6">Household Total kWh</div>
                    <div class="text-body2 text-weight-medium">{{ bill.householdTotalKwh?.toLocaleString() }} kWh</div>
                  </div>
                  <div class="col-6">
                    <div class="text-caption text-grey-6">Rate per kWh</div>
                    <div class="text-body2 text-weight-medium">₱{{ bill.ratePerKwh }}</div>
                  </div>
                  <div class="col-6">
                    <div class="text-caption text-grey-6">Device Total kWh</div>
                    <div class="text-body2 text-weight-medium">{{ bill.deviceTotalKwh }} kWh</div>
                  </div>
                  <div class="col-6">
                    <div class="text-caption text-grey-6">Avg kWh/day</div>
                    <div class="text-body2 text-weight-medium">{{ bill.avgKwhPerDay }} kWh</div>
                  </div>
                  <div class="col-6">
                    <div class="text-caption text-grey-6">Days Active</div>
                    <div class="text-body2 text-weight-medium">{{ bill.daysActive }} days</div>
                  </div>
                  <div class="col-12">
                    <div class="text-caption text-grey-6">Peak Day</div>
                    <div class="text-body2 text-weight-medium">{{ bill.peakDayKwh }} kWh</div>
                  </div>
                </div>
              </q-card-section>
              <q-card-actions align="right" class="q-pt-none">
                <q-btn flat round dense icon="delete" color="negative" @click="confirmDelete(bill)">
                  <q-tooltip>Delete record</q-tooltip>
                </q-btn>
              </q-card-actions>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Chart View -->
      <div v-if="bills.length > 0 && viewMode === 'chart'">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-caption text-grey-7 q-mb-sm">AC Electricity Cost per Period (₱)</div>
            <div class="line-chart-container">
              <svg class="line-chart" viewBox="0 0 600 220" preserveAspectRatio="none">
                <line v-for="i in 5" :key="'grid-' + i" :x1="50" :y1="i * 40" :x2="580" :y2="i * 40" stroke="#e0e0e0" stroke-width="1" />
                <text
                  v-for="(bill, index) in chartBills" :key="'label-' + index"
                  :x="getChartX(index)" y="215"
                  text-anchor="middle" font-size="10" fill="#666"
                >{{ index % chartLabelInterval === 0 ? bill.shortLabel : '' }}</text>
                <text v-for="i in 6" :key="'ylabel-' + i" x="45" :y="200 - (i - 1) * 40 + 5" text-anchor="end" font-size="10" fill="#666">{{ ((maxBill / 5) * (i - 1)).toFixed(0) }}</text>
                <polyline :points="chartLinePoints" fill="none" stroke="#43a047" stroke-width="2" stroke-linejoin="round" />
                <polygon :points="chartAreaPoints" fill="rgba(67, 160, 71, 0.1)" />
                <circle
                  v-for="(bill, index) in chartBills" :key="'point-' + index"
                  :cx="getChartX(index)" :cy="getChartY(bill.calculatedBill)"
                  r="4" fill="#43a047" stroke="white" stroke-width="2"
                >
                  <title>{{ bill.dateRange }}: ₱{{ bill.calculatedBill }}</title>
                </circle>
              </svg>
            </div>
          </q-card-section>
        </q-card>
      </div>

    </div>

    <!-- Delete Confirm Dialog -->
    <q-dialog v-model="showDeleteDialog">
      <q-card style="min-width: 280px">
        <q-card-section>
          <div class="text-h6">Delete Bill Record?</div>
          <div class="text-caption text-grey-7 q-mt-xs">{{ billToDelete?.dateRange }}</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" v-close-popup />
          <q-btn flat label="Delete" color="negative" @click="deleteBill" :loading="deleting" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { auth, firestore } from 'src/boot/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { useAuthStore } from 'src/stores/authStore';
import ProfileMenu from 'src/components/ProfileMenu.vue';

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();

const bills = ref([]);
const loading = ref(true);
const viewMode = ref('card');
const showDeleteDialog = ref(false);
const billToDelete = ref(null);
const deleting = ref(false);
let currentUid = null;
let unsubscribeAuth = null;

const totalBill = computed(() =>
  bills.value.reduce((sum, b) => sum + (b.calculatedBill || 0), 0)
    .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
);

// Chart — show oldest to newest
const chartBills = computed(() =>
  [...bills.value].reverse().map(b => ({
    ...b,
    shortLabel: b.dateRange?.split('–')[0]?.trim().slice(5) || ''
  }))
);
const maxBill = computed(() => Math.max(...chartBills.value.map(b => b.calculatedBill || 0), 1));
const chartLabelInterval = computed(() => {
  const len = chartBills.value.length;
  if (len <= 6) return 1;
  if (len <= 12) return 2;
  return 3;
});
const getChartX = (i) => 50 + i * (530 / (chartBills.value.length - 1 || 1));
const getChartY = (v) => 200 - (v / maxBill.value) * 200;
const chartLinePoints = computed(() => chartBills.value.map((b, i) => `${getChartX(i)},${getChartY(b.calculatedBill)}`).join(' '));
const chartAreaPoints = computed(() => {
  const pts = chartBills.value.map((b, i) => `${getChartX(i)},${getChartY(b.calculatedBill)}`).join(' ');
  return `${pts} ${getChartX(chartBills.value.length - 1)},200 ${getChartX(0)},200`;
});

const goBack = () => router.back();

const formatSavedAt = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const fetchBills = async () => {
  loading.value = true;
  try {
    const q = query(collection(firestore, 'users', currentUid, 'bills'), orderBy('savedAt', 'desc'));
    const snapshot = await getDocs(q);
    bills.value = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    $q.notify({ type: 'negative', message: `Failed to load bills: ${err.message}`, icon: 'error' });
  } finally {
    loading.value = false;
  }
};

const confirmDelete = (bill) => {
  billToDelete.value = bill;
  showDeleteDialog.value = true;
};

const deleteBill = async () => {
  deleting.value = true;
  try {
    await deleteDoc(doc(firestore, 'users', currentUid, 'bills', billToDelete.value.id));
    bills.value = bills.value.filter(b => b.id !== billToDelete.value.id);
    $q.notify({ type: 'positive', message: 'Record deleted', icon: 'delete' });
    showDeleteDialog.value = false;
  } catch (err) {
    $q.notify({ type: 'negative', message: `Failed to delete: ${err.message}`, icon: 'error' });
  } finally {
    deleting.value = false;
  }
};

onMounted(() => {
  unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    if (!user) { router.replace('/signin'); return; }
    authStore.setUser(user);
    currentUid = user.uid;
    fetchBills();
  });
});

onUnmounted(() => {
  if (unsubscribeAuth) unsubscribeAuth();
});
</script>

<style scoped>
.line-chart-container { width: 100%; padding: 10px 0; }
.line-chart { display: block; width: 100%; height: 280px; }
.line-chart circle:hover { r: 6; cursor: pointer; }
.bill-card {
  border-left: 3px solid #1976d2;
  transition: all 0.2s ease;
}
.bill-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
