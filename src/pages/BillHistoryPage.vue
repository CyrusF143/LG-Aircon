<template>
  <q-page class="bh-page">

      <!-- Header -->
      <div class="bh-topbar sticky-header">
        <div class="bh-topbar-inner">
          <q-btn flat dense round icon="arrow_back" color="white" @click="goBack" class="q-mr-sm" />
          <div class="bh-topbar-icon">
            <q-icon name="receipt_long" size="22px" color="white" />
          </div>
          <div>
            <div class="bh-topbar-title">Bill History</div>
            <div class="bh-topbar-sub">Saved electricity bill records</div>
          </div>
          <q-space />
          <q-btn
            v-if="bills.length > 0"
            flat dense round icon="download" color="white"
            @click="downloadCSV"
          >
            <q-tooltip>Download as CSV</q-tooltip>
          </q-btn>
          <ProfileMenu />
        </div>
      </div>

      <div class="bh-content">

        <!-- Loading -->
        <div v-if="loading" class="text-center q-pa-xl">
          <q-spinner size="50px" color="primary" />
          <div class="q-mt-md text-grey-6">Loading bill history...</div>
        </div>

        <!-- Empty State -->
        <div v-else-if="bills.length === 0" class="bh-empty">
          <div class="bh-empty-icon"><q-icon name="receipt_long" size="48px" color="blue-3" /></div>
          <div class="bh-empty-title">No saved bills yet</div>
          <div class="bh-empty-sub">Bills saved from the calculator will appear here</div>
        </div>

        <template v-else>
          <!-- Total Summary -->
          <div class="bh-summary-card">
            <div class="bh-summary-left">
              <div class="bh-summary-label">Total AC Electricity Cost</div>
              <div class="bh-summary-sub">Across all {{ bills.length }} record{{ bills.length > 1 ? 's' : '' }}</div>
            </div>
            <div class="bh-summary-amount">₱{{ totalBill }}</div>
          </div>

          <!-- View Toggle -->
          <div class="bh-toolbar">
            <div class="bh-record-count">
              <q-icon name="folder_open" size="16px" class="q-mr-xs text-grey-6" />
              <span>{{ bills.length }} record{{ bills.length > 1 ? 's' : '' }}</span>
            </div>
            <q-btn-toggle
              v-model="viewMode"
              toggle-color="primary"
              flat
              :options="[
                { label: 'List', value: 'list', icon: 'list' },
                { label: 'Card', value: 'card', icon: 'grid_view' },
                { label: 'Chart', value: 'chart', icon: 'bar_chart' }
              ]"
              size="sm" dense unelevated
            />
          </div>
        </template>
      </div>

      <!-- List / Card / Chart views -->
      <div class="bh-content">
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
              <q-btn flat round dense icon="image" color="primary" size="sm" @click="downloadCardImage(bill)" :loading="downloadingId === bill.id">
                <q-tooltip>Download as image</q-tooltip>
              </q-btn>
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
            <div class="bill-card">

              <!-- Card header -->
              <div class="bc-header">
                <div>
                  <div class="bc-title">AC Device Usage Cost</div>
                  <div class="bc-date">
                    <q-icon name="date_range" size="13px" class="q-mr-xs" />{{ bill.dateRange }}
                  </div>
                </div>
                <div class="bc-saved">{{ formatSavedAt(bill.savedAt) }}</div>
              </div>

              <!-- 2×2 stat chips -->
              <div class="bc-stat-grid">
                <div class="bc-chip">
                  <div class="bc-chip-label">Household Amount Due</div>
                  <div class="bc-chip-value blue">₱{{ bill.householdAmountDue?.toLocaleString() }}</div>
                </div>
                <div class="bc-chip">
                  <div class="bc-chip-label">Household Total kWh</div>
                  <div class="bc-chip-value blue">{{ bill.householdTotalKwh?.toLocaleString() }} kWh</div>
                </div>
                <div class="bc-chip">
                  <div class="bc-chip-label">Rate per kWh</div>
                  <div class="bc-chip-value teal">₱{{ bill.ratePerKwh }}</div>
                </div>
                <div class="bc-chip">
                  <div class="bc-chip-label">Device Total kWh</div>
                  <div class="bc-chip-value teal">{{ bill.deviceTotalKwh }} kWh</div>
                </div>
                <div class="bc-chip">
                  <div class="bc-chip-label">Avg kWh/day</div>
                  <div class="bc-chip-value purple">{{ bill.avgKwhPerDay }} kWh</div>
                </div>
                <div class="bc-chip">
                  <div class="bc-chip-label">Days Active</div>
                  <div class="bc-chip-value purple">{{ bill.daysActive }} days</div>
                </div>
                <div class="bc-chip bc-chip--full">
                  <div class="bc-chip-label">Peak Day</div>
                  <div class="bc-chip-value orange">{{ bill.peakDayKwh }} kWh</div>
                </div>
              </div>

              <!-- Cost section -->
              <div class="bc-cost-section">
                <div class="bc-cost-label">YOUR AC ELECTRICITY COST</div>
                <div class="bc-cost-amount">₱{{ bill.calculatedBill?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
                <div class="bc-cost-sub">for the selected period</div>
              </div>

              <!-- Actions -->
              <div class="bc-actions">
                <q-btn flat round dense icon="image" color="primary" size="sm" @click="downloadCardImage(bill)" :loading="downloadingId === bill.id">
                  <q-tooltip>Download as image</q-tooltip>
                </q-btn>
                <q-btn flat round dense icon="delete" color="negative" size="sm" @click="confirmDelete(bill)">
                  <q-tooltip>Delete record</q-tooltip>
                </q-btn>
              </div>

            </div>
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

      </div><!-- end bh-content views -->

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
import html2canvas from 'html2canvas';
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
const downloadingId = ref(null);
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

const downloadCardImage = async (bill) => {
  downloadingId.value = bill.id;
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;left:-9999px;top:0;width:380px;font-family:Roboto,sans-serif;border-radius:16px;border:1.5px solid #90caf9;background:linear-gradient(145deg,#f0f7ff 0%,#f0fff4 100%);overflow:hidden;padding:18px 18px 0';

  const chip = (label, value, color) => `
    <div style="background:white;border-radius:10px;padding:9px 11px;border:1px solid #e3eaf5">
      <div style="font-size:10px;color:#999;font-weight:600;text-transform:uppercase;letter-spacing:0.3px;margin-bottom:3px">${label}</div>
      <div style="font-size:14px;font-weight:700;color:${color}">${value}</div>
    </div>`;

  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
      <div>
        <div style="font-size:15px;font-weight:700;color:#1a1a1a;margin-bottom:3px">AC Device Usage Cost</div>
        <div style="font-size:12px;color:#777;display:flex;align-items:center;gap:4px">📅 ${bill.dateRange}</div>
      </div>
      <div style="font-size:11px;color:#aaa;text-align:right">${formatSavedAt(bill.savedAt)}</div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
      ${chip('Household Amount Due', '₱' + bill.householdAmountDue?.toLocaleString(), '#1565c0')}
      ${chip('Household Total kWh', bill.householdTotalKwh?.toLocaleString() + ' kWh', '#1565c0')}
      ${chip('Rate per kWh', '₱' + bill.ratePerKwh, '#00796b')}
      ${chip('Device Total kWh', bill.deviceTotalKwh + ' kWh', '#00796b')}
      ${chip('Avg kWh/day', bill.avgKwhPerDay + ' kWh', '#6a1b9a')}
      ${chip('Days Active', bill.daysActive + ' days', '#6a1b9a')}
      <div style="grid-column:span 2;background:white;border-radius:10px;padding:9px 11px;border:1px solid #e3eaf5">
        <div style="font-size:10px;color:#999;font-weight:600;text-transform:uppercase;letter-spacing:0.3px;margin-bottom:3px">Peak Day</div>
        <div style="font-size:14px;font-weight:700;color:#e65100">${bill.peakDayKwh} kWh</div>
      </div>
    </div>

    <div style="background:white;border-radius:12px;border:1px solid #c8e6c9;text-align:center;padding:14px 12px 12px;margin-bottom:18px">
      <div style="font-size:10px;font-weight:600;color:#999;letter-spacing:0.8px;text-transform:uppercase;margin-bottom:4px">YOUR AC ELECTRICITY COST</div>
      <div style="font-size:2.4rem;font-weight:800;color:#2e7d32;line-height:1.1;letter-spacing:-1px">₱${bill.calculatedBill?.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
      <div style="font-size:11px;color:#bbb;margin-top:4px">for the selected period</div>
    </div>`;

  document.body.appendChild(el);
  try {
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `bill-${bill.dateRange?.replace(/\//g, '-').replace(/\s/g, '') ?? bill.id}.png`;
    a.click();
  } catch (err) {
    $q.notify({ type: 'negative', message: `Failed to download image: ${err.message}`, icon: 'error' });
  } finally {
    document.body.removeChild(el);
    downloadingId.value = null;
  }
};

const downloadCSV = () => {
  const headers = ['Date Range', 'Saved At', 'AC Electricity Cost (₱)', 'Household Amount Due (₱)', 'Household Total kWh', 'Rate per kWh (₱)', 'Device Total kWh', 'Avg kWh/day', 'Days Active', 'Peak Day kWh'];
  const rows = bills.value.map(b => [
    b.dateRange,
    formatSavedAt(b.savedAt),
    b.calculatedBill?.toFixed(2),
    b.householdAmountDue,
    b.householdTotalKwh,
    b.ratePerKwh,
    b.deviceTotalKwh,
    b.avgKwhPerDay,
    b.daysActive,
    b.peakDayKwh
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bill-history-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

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
/* Page */
.bh-page {
  background: #f4f6fb;
  min-height: 100vh;
  padding: 0;
}

/* Top bar */
.bh-topbar {
  background: linear-gradient(135deg, #1565c0 0%, #1976d2 60%, #1e88e5 100%);
  padding: 0 16px;
}
.bh-topbar-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
}
.bh-topbar-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255,255,255,0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.bh-topbar-title {
  font-size: 20px;
  font-weight: 700;
  color: white;
  line-height: 1.2;
}
.bh-topbar-sub {
  font-size: 12px;
  color: rgba(255,255,255,0.75);
}

/* Content wrapper */
.bh-content {
  padding: 20px 16px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Summary card */
.bh-summary-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #e8f5e9 0%, #f0f7ff 100%);
  border: 1.5px solid #a5d6a7;
  border-radius: 16px;
  padding: 20px 28px;
  margin-bottom: 20px;
}
.bh-summary-label {
  font-size: 13px;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}
.bh-summary-sub {
  font-size: 12px;
  color: #999;
}
.bh-summary-amount {
  font-size: 2.4rem;
  font-weight: 800;
  color: #2e7d32;
  letter-spacing: -1px;
}

/* Toolbar */
.bh-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.bh-record-count {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #777;
  font-weight: 500;
}

/* Empty state */
.bh-empty {
  text-align: center;
  padding: 80px 20px;
}
.bh-empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: #e3f2fd;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}
.bh-empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #444;
  margin-bottom: 6px;
}
.bh-empty-sub {
  font-size: 13px;
  color: #aaa;
}

.line-chart-container { width: 100%; padding: 10px 0; }
.line-chart { display: block; width: 100%; height: 280px; }
.line-chart circle:hover { r: 6; cursor: pointer; }

/* Bill card */
.bill-card {
  border-radius: 16px;
  background: linear-gradient(145deg, #f0f7ff 0%, #f0fff4 100%);
  border: 1.5px solid #90caf9;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  padding: 16px 16px 0;
}
.bill-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(25, 118, 210, 0.15);
}

.bc-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
}
.bc-title {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 3px;
}
.bc-date {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #777;
}
.bc-saved {
  font-size: 11px;
  color: #aaa;
  white-space: nowrap;
  margin-left: 8px;
  flex-shrink: 0;
}

/* Stat chips */
.bc-stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}
.bc-chip {
  background: white;
  border-radius: 10px;
  padding: 8px 10px;
  border: 1px solid #e3eaf5;
}
.bc-chip--full {
  grid-column: span 2;
}
.bc-chip-label {
  font-size: 10px;
  color: #999;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 3px;
}
.bc-chip-value {
  font-size: 14px;
  font-weight: 700;
}
.bc-chip-value.blue   { color: #1565c0; }
.bc-chip-value.teal   { color: #00796b; }
.bc-chip-value.purple { color: #6a1b9a; }
.bc-chip-value.orange { color: #e65100; }

/* Cost section */
.bc-cost-section {
  background: white;
  border-radius: 12px;
  border: 1px solid #c8e6c9;
  text-align: center;
  padding: 12px 10px 10px;
  margin-bottom: 0;
}
.bc-cost-label {
  font-size: 10px;
  font-weight: 600;
  color: #999;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  margin-bottom: 3px;
}
.bc-cost-amount {
  font-size: 2rem;
  font-weight: 800;
  color: #2e7d32;
  line-height: 1.1;
  letter-spacing: -1px;
}
.bc-cost-sub {
  font-size: 10px;
  color: #bbb;
  margin-top: 3px;
}

/* Actions */
.bc-actions {
  display: flex;
  justify-content: flex-end;
  padding: 4px 0 6px;
}
</style>
