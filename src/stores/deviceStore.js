import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDeviceStore = defineStore('device', () => {
  const selectedDevice = ref(null)

  const setDevice = (device) => {
    selectedDevice.value = device
  }

  const clearDevice = () => {
    selectedDevice.value = null
  }

  return { selectedDevice, setDevice, clearDevice }
})
