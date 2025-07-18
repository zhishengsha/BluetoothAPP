<template>
  <view class="tab-header">
    <text :class="activeTab === 0 ? 'active' : ''" @click="activeTab = 0">扫描设备</text>
    <text :class="activeTab === 1 ? 'active' : ''" @click="activeTab = 1">设备详情</text>
  </view>
  
  <view class="tab-content">
    <ScanPage v-show="activeTab === 0" @device-connected="handleDeviceConnected"/>
    <DevicePage v-show="activeTab === 1" :device="connectedDevice" />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import ScanPage from './components/ScanPage.vue'
import DevicePage from './components/DevicePage.vue'

const activeTab = ref(0)
const connectedDevice = ref(null)

function handleDeviceConnected(device) {
  connectedDevice.value = device
  activeTab.value = 1
}
</script>

<style>
	/*每个页面公共css */
</style>
