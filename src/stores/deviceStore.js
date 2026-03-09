import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDeviceStore = defineStore('device', () => {
  const selectedDevice = ref(null)
  const selectedDateRange = ref(null)
  const selectedPeriodType = ref('DAILY')

  const setDevice = (device) => {
    selectedDevice.value = device
  }

  const setDateRange = (dateRange, periodType) => {
    selectedDateRange.value = dateRange
    selectedPeriodType.value = periodType
  }

  const clearDevice = () => {
    selectedDevice.value = null
    selectedDateRange.value = null
    selectedPeriodType.value = 'DAILY'
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
