if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global = uni.requireGlobal();
  ArrayBuffer = global.ArrayBuffer;
  Int8Array = global.Int8Array;
  Uint8Array = global.Uint8Array;
  Uint8ClampedArray = global.Uint8ClampedArray;
  Int16Array = global.Int16Array;
  Uint16Array = global.Uint16Array;
  Int32Array = global.Int32Array;
  Uint32Array = global.Uint32Array;
  Float32Array = global.Float32Array;
  Float64Array = global.Float64Array;
  BigInt64Array = global.BigInt64Array;
  BigUint64Array = global.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$1 = {
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const devices = vue.ref([]);
      const isScanning = vue.ref(false);
      const connectedDeviceId = vue.ref(null);
      const characteristics = vue.ref([]);
      const startBluetooth = () => {
        uni.openBluetoothAdapter({
          success() {
            formatAppLog("log", "at pages/index/index.vue:51", "蓝牙已开启");
          },
          fail(err) {
            formatAppLog("error", "at pages/index/index.vue:54", "蓝牙开启失败", err);
          }
        });
      };
      const startScan = () => {
        if (isScanning.value)
          return;
        devices.value = [];
        isScanning.value = true;
        uni.startBluetoothDevicesDiscovery({
          allowDuplicatesKey: false,
          success() {
            formatAppLog("log", "at pages/index/index.vue:67", "开始扫描");
          },
          fail(err) {
            isScanning.value = false;
            formatAppLog("error", "at pages/index/index.vue:71", "扫描失败", err);
          }
        });
        uni.onBluetoothDeviceFound((res) => {
          res.devices.forEach((device) => {
            if (device.name || device.localName) {
              const exists = devices.value.find((d) => d.deviceId === device.deviceId);
              if (!exists) {
                devices.value.push(device);
              }
            }
          });
        });
      };
      const stopScan = () => {
        uni.stopBluetoothDevicesDiscovery({
          success() {
            isScanning.value = false;
            formatAppLog("log", "at pages/index/index.vue:92", "已停止扫描");
          }
        });
      };
      const connectDevice = (deviceId) => {
        uni.createBLEConnection({
          deviceId,
          success() {
            connectedDeviceId.value = deviceId;
            getServicesAndCharacteristics(deviceId);
          },
          fail(err) {
            formatAppLog("error", "at pages/index/index.vue:106", "连接失败", err);
          }
        });
      };
      const getServicesAndCharacteristics = (deviceId) => {
        uni.getBLEDeviceServices({
          deviceId,
          success(res) {
            formatAppLog("log", "at pages/index/index.vue:116", "服务列表", res.services);
            res.services.forEach((service) => {
              uni.getBLEDeviceCharacteristics({
                deviceId,
                serviceId: service.uuid,
                success(res2) {
                  res2.characteristics.forEach((char) => {
                    if (char.properties.read || char.properties.write) {
                      characteristics.value.push({
                        serviceId: service.uuid,
                        characteristicId: char.uuid,
                        properties: char.properties,
                        inputValue: "",
                        readValue: ""
                      });
                    }
                  });
                }
              });
            });
          }
        });
      };
      const writeCharacteristic = (item) => {
        const str = item.inputValue;
        if (!str)
          return uni.showToast({ title: "请输入内容", icon: "none" });
        const buffer = new TextEncoder().encode(str).buffer;
        uni.writeBLECharacteristicValue({
          deviceId: connectedDeviceId.value,
          serviceId: item.serviceId,
          characteristicId: item.characteristicId,
          value: buffer,
          success() {
            uni.showToast({ title: "写入成功" });
          },
          fail(err) {
            formatAppLog("error", "at pages/index/index.vue:157", "写入失败", err);
          }
        });
      };
      const readCharacteristic = (item) => {
        uni.readBLECharacteristicValue({
          deviceId: connectedDeviceId.value,
          serviceId: item.serviceId,
          characteristicId: item.characteristicId,
          success() {
            uni.onBLECharacteristicValueChange((res) => {
              const decoded = new TextDecoder().decode(res.value);
              item.readValue = decoded;
              formatAppLog("log", "at pages/index/index.vue:173", "读取值:", decoded);
            });
          },
          fail(err) {
            formatAppLog("error", "at pages/index/index.vue:177", "读取失败", err);
          }
        });
        uni.notifyBLECharacteristicValueChange({
          deviceId: connectedDeviceId.value,
          serviceId: item.serviceId,
          characteristicId: item.characteristicId,
          state: true
        });
      };
      const disconnectDevice = () => {
        uni.closeBLEConnection({
          deviceId: connectedDeviceId.value,
          success() {
            connectedDeviceId.value = null;
            characteristics.value = [];
            formatAppLog("log", "at pages/index/index.vue:197", "已断开连接");
          }
        });
      };
      vue.onUnmounted(() => {
        stopScan();
        if (connectedDeviceId.value)
          disconnectDevice();
        uni.closeBluetoothAdapter();
      });
      const __returned__ = { devices, isScanning, connectedDeviceId, characteristics, startBluetooth, startScan, stopScan, connectDevice, getServicesAndCharacteristics, writeCharacteristic, readCharacteristic, disconnectDevice, ref: vue.ref, onUnmounted: vue.onUnmounted };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("button", { onClick: $setup.startBluetooth }, "开启蓝牙"),
      vue.createElementVNode("button", {
        onClick: $setup.startScan,
        disabled: $setup.isScanning
      }, "开始扫描", 8, ["disabled"]),
      vue.createElementVNode("button", {
        onClick: $setup.stopScan,
        disabled: !$setup.isScanning
      }, "停止扫描", 8, ["disabled"]),
      vue.createCommentVNode(" 设备列表 "),
      (vue.openBlock(true), vue.createElementBlock(
        vue.Fragment,
        null,
        vue.renderList($setup.devices, (device) => {
          return vue.openBlock(), vue.createElementBlock("view", {
            key: device.deviceId,
            class: "device-item"
          }, [
            vue.createElementVNode(
              "text",
              null,
              vue.toDisplayString(device.name || "未知设备"),
              1
              /* TEXT */
            ),
            vue.createElementVNode("button", {
              onClick: ($event) => $setup.connectDevice(device.deviceId)
            }, "连接", 8, ["onClick"])
          ]);
        }),
        128
        /* KEYED_FRAGMENT */
      )),
      vue.createCommentVNode(" 已连接设备 "),
      $setup.connectedDeviceId ? (vue.openBlock(), vue.createElementBlock("view", { key: 0 }, [
        vue.createElementVNode(
          "text",
          null,
          "已连接: " + vue.toDisplayString($setup.connectedDeviceId),
          1
          /* TEXT */
        ),
        vue.createElementVNode("button", { onClick: $setup.disconnectDevice }, "断开连接"),
        vue.createCommentVNode(" 特征值列表 "),
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($setup.characteristics, (item, index) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              key: index,
              class: "char-item"
            }, [
              vue.createElementVNode("view", null, [
                vue.createElementVNode(
                  "text",
                  null,
                  "服务ID: " + vue.toDisplayString(item.serviceId.slice(0, 8)),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  null,
                  " 特征ID: " + vue.toDisplayString(item.characteristicId.slice(0, 8)),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  null,
                  " [" + vue.toDisplayString(item.properties.read ? "可读" : "") + vue.toDisplayString(item.properties.write ? "可写" : "") + "]",
                  1
                  /* TEXT */
                )
              ]),
              vue.withDirectives(vue.createElementVNode("input", {
                "onUpdate:modelValue": ($event) => item.inputValue = $event,
                placeholder: "输入内容"
              }, null, 8, ["onUpdate:modelValue"]), [
                [vue.vModelText, item.inputValue]
              ]),
              vue.createElementVNode("view", { class: "btn-group" }, [
                item.properties.read ? (vue.openBlock(), vue.createElementBlock("button", {
                  key: 0,
                  onClick: ($event) => $setup.readCharacteristic(item)
                }, "读取", 8, ["onClick"])) : vue.createCommentVNode("v-if", true),
                item.properties.write ? (vue.openBlock(), vue.createElementBlock("button", {
                  key: 1,
                  onClick: ($event) => $setup.writeCharacteristic(item)
                }, "写入", 8, ["onClick"])) : vue.createCommentVNode("v-if", true)
              ]),
              item.readValue ? (vue.openBlock(), vue.createElementBlock(
                "view",
                { key: 0 },
                "读取值: " + vue.toDisplayString(item.readValue),
                1
                /* TEXT */
              )) : vue.createCommentVNode("v-if", true)
            ]);
          }),
          128
          /* KEYED_FRAGMENT */
        ))
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesIndexIndex = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render], ["__file", "G:/Project/TLK/Tool/ble/pages/index/index.vue"]]);
  __definePage("pages/index/index", PagesIndexIndex);
  const _sfc_main = {
    onLaunch: function() {
      formatAppLog("log", "at App.vue:4", "App Launch");
    },
    onShow: function() {
      formatAppLog("log", "at App.vue:7", "App Show");
    },
    onHide: function() {
      formatAppLog("log", "at App.vue:10", "App Hide");
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "G:/Project/TLK/Tool/ble/App.vue"]]);
  function createApp() {
    const app = vue.createVueApp(App);
    return {
      app
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue);
