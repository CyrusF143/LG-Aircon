import { defineStore } from 'pinia'
import { ref } from 'vue'

const SESSION_KEY = 'selectedDevice'

export const useDeviceStore = defineStore('device', () => {
  // Restore from sessionStorage on page refresh
  const stored = sessionStorage.getItem(SESSION_KEY)
  const selectedDevice = ref(stored ? JSON.parse(stored) : null)
  const selectedDateRange = ref(null)
  const selectedPeriodType = ref('DAILY')

  const setDevice = (device) => {
    selectedDevice.value = device
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(device))
  }

  const setDateRange = (dateRange, periodType) => {
    selectedDateRange.value = dateRange
    selectedPeriodType.value = periodType
  }

  const clearDevice = () => {
    selectedDevice.value = null
    selectedDateRange.value = null
    selectedPeriodType.value = 'DAILY'
    sessionStorage.removeItem(SESSION_KEY)
  }

  return {
    selectedDevice,
    selectedDateRange,
    selectedPeriodType,
    setDevice,
    setDateRange,
    clearDevice
  }
})
