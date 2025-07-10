<template>
  <view class="container">
    <button @click="startBluetooth">开启蓝牙</button>
    <button @click="startScan" :disabled="isScanning">开始扫描</button>
    <button @click="stopScan" :disabled="!isScanning">停止扫描</button>

    <!-- 设备列表 -->
    <view v-for="device in devices" :key="device.deviceId" class="device-item">
      <text>{{ device.name || '未知设备' }}</text>
      <button @click="connectDevice(device.deviceId)">连接</button>
    </view>

    <!-- 已连接设备 -->
    <view v-if="connectedDeviceId">
      <text>已连接: {{ connectedDeviceId }}</text>
      <button @click="disconnectDevice">断开连接</button>

      <!-- 特征值列表 -->
      <view v-for="(item, index) in characteristics" :key="index" class="char-item">
        <view>
          <text>服务ID: {{ item.serviceId.slice(0, 8) }}</text>
          <text> 特征ID: {{ item.characteristicId.slice(0, 8) }}</text>
          <text> [{{ item.properties.read ? '可读' : '' }}{{ item.properties.write ? '可写' : '' }}]</text>
        </view>

        <input v-model="item.inputValue" placeholder="输入内容" />

        <view class="btn-group">
          <button v-if="item.properties.read" @click="readCharacteristic(item)">读取</button>
          <button v-if="item.properties.write" @click="writeCharacteristic(item)">写入</button>
        </view>

        <view v-if="item.readValue">读取值: {{ item.readValue }}</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'

const devices = ref([])
const isScanning = ref(false)
const connectedDeviceId = ref(null)
const characteristics = ref([])

// 开启蓝牙适配器
const startBluetooth = () => {
  uni.openBluetoothAdapter({
    success() {
      console.log('蓝牙已开启')
    },
    fail(err) {
      console.error('蓝牙开启失败', err)
    }
  })
}

// 扫描设备
const startScan = () => {
  if (isScanning.value) return
  devices.value = []
  isScanning.value = true
  uni.startBluetoothDevicesDiscovery({
    allowDuplicatesKey: false,
    success() {
      console.log('开始扫描')
    },
    fail(err) {
      isScanning.value = false
      console.error('扫描失败', err)
    }
  })

  uni.onBluetoothDeviceFound((res) => {
    res.devices.forEach(device => {
      if (device.name || device.localName) {
        const exists = devices.value.find(d => d.deviceId === device.deviceId)
        if (!exists) {
          devices.value.push(device)
        }
      }
    })
  })
}

// 停止扫描
const stopScan = () => {
  uni.stopBluetoothDevicesDiscovery({
    success() {
      isScanning.value = false
      console.log('已停止扫描')
    }
  })
}

// 连接设备
const connectDevice = (deviceId) => {
  uni.createBLEConnection({
    deviceId,
    success() {
      connectedDeviceId.value = deviceId
      getServicesAndCharacteristics(deviceId)
    },
    fail(err) {
      console.error('连接失败', err)
    }
  })
}

// 获取服务与特征值
const getServicesAndCharacteristics = (deviceId) => {
  uni.getBLEDeviceServices({
    deviceId,
    success(res) {
      console.log('服务列表', res.services)
      res.services.forEach(service => {
        uni.getBLEDeviceCharacteristics({
          deviceId,
          serviceId: service.uuid,
          success(res2) {
            res2.characteristics.forEach(char => {
              if (char.properties.read || char.properties.write) {
                characteristics.value.push({
                  serviceId: service.uuid,
                  characteristicId: char.uuid,
                  properties: char.properties,
                  inputValue: '',
                  readValue: ''
                })
              }
            })
          }
        })
      })
    }
  })
}

// 写入特征值
const writeCharacteristic = (item) => {
  const str = item.inputValue
  if (!str) return uni.showToast({ title: '请输入内容', icon: 'none' })

  // 转换为 ArrayBuffer
  const buffer = new TextEncoder().encode(str).buffer

  uni.writeBLECharacteristicValue({
    deviceId: connectedDeviceId.value,
    serviceId: item.serviceId,
    characteristicId: item.characteristicId,
    value: buffer,
    success() {
      uni.showToast({ title: '写入成功' })
    },
    fail(err) {
      console.error('写入失败', err)
    }
  })
}

// 读取特征值
const readCharacteristic = (item) => {
  uni.readBLECharacteristicValue({
    deviceId: connectedDeviceId.value,
    serviceId: item.serviceId,
    characteristicId: item.characteristicId,
    success() {
      // 监听读取数据
      uni.onBLECharacteristicValueChange((res) => {
        const decoded = new TextDecoder().decode(res.value)
        item.readValue = decoded
        console.log('读取值:', decoded)
      })
    },
    fail(err) {
      console.error('读取失败', err)
    }
  })

  // 主动启动监听（必须配合 read）
  uni.notifyBLECharacteristicValueChange({
    deviceId: connectedDeviceId.value,
    serviceId: item.serviceId,
    characteristicId: item.characteristicId,
    state: true
  })
}

// 断开连接
const disconnectDevice = () => {
  uni.closeBLEConnection({
    deviceId: connectedDeviceId.value,
    success() {
      connectedDeviceId.value = null
      characteristics.value = []
      console.log('已断开连接')
    }
  })
}

onUnmounted(() => {
  stopScan()
  if (connectedDeviceId.value) disconnectDevice()
  uni.closeBluetoothAdapter()
})
</script>

<style>
.container {
  padding: 20rpx;
}
.device-item, .char-item {
  border: 1px solid #ddd;
  margin: 10rpx 0;
  padding: 10rpx;
  border-radius: 8rpx;
}
.btn-group {
  display: flex;
  gap: 10rpx;
  margin-top: 8rpx;
}
</style>
