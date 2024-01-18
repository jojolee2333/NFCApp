<template>
    <view class="content">
        <!-- <button @click="writeData" style="margin: 40rpx 0;">写数据</button> -->
        <button @click="readData" style="margin: 40rpx 0;">读数据</button>
        <div v-html="content"></div>
        <u-popup :show="popShow" @close="popShow=false" @open="popShow=true" mode="center">
            <view class="pop-box">
                <text>请将NFC标签靠近</text>
            </view>
        </u-popup>
        
        <view class="charts-box">
            <qiun-data-charts type="line" :opts="opts" :chartData="chartData">
            </qiun-data-charts>
        </view>
        <button @click="rotateChart" style="margin: 40rpx 0 0 0;">旋转</button>
        <button @click="stopGenerateData" style="margin: 40rpx 0 0 0;">停止生成数据</button>
        <button @click="getServerData" style="margin: 40rpx 0 0 0;">重新生成数据</button>
        
        <!-- <view class="rotate-mode-btn iconfont icon-a-appenlarge" @click="rotateMode"></view> -->
        <!-- <u-mask :show="isShowRotate">
         	<view :class="maskClass"></view>
         	<view class="iconfont icon-close" @click="closeRotateMode"></view>
         </u-mask> -->
    </view>
</template>

<script>
    var NfcAdapter;
    var NdefRecord;
    var NdefMessage;

    export default {
        data() {
            return {
                readyWriteData: false,
                readyRead: false,
                nfcAdapter: null,
                main: null,
                pendingIntent: null,
                intentFiltersArray: [],
                techListsArray: [],
                content: '',

                sramData: '',
                intent: '', // 好像很重要
                uID: '', // NFC卡ID
                popShow: false,
                chartData: {},
                intervalId: null, // 定时器ID
                //您可以通过修改 config-ucharts.js 文件中下标为 ['line'] 的节点来配置全局默认参数，如都是默认参数，此处可以不传 opts 。实际应用过程中 opts 只需传入与全局默认参数中不一致的【某一个属性】即可实现同类型的图表显示不同的样式，达到页面简洁的需求。
                opts: {
                    animation: false,
                    duration: 0,
                    update: true,
                    rotate: false,
                    color: ["#1890FF", "#91CB74", "#FAC858", "#EE6666", "#73C0DE", "#3CA272", "#FC8452", "#9A60B4",
                        "#ea7ccc"
                    ],
                    padding: [15, 10, 0, 15],
                    enableScroll: false,
                    legend: {},
                    xAxis: {
                        disableGrid: true,
                        calibration: true,
                        min: 0,
                        max: 100,
                    },
                    yAxis: {
                        gridType: "dash",
                        dashLength: 2
                    },
                    extra: {
                        line: {
                            type: "straight",
                            width: 2,
                            activeType: "hollow"
                        }
                    }
                }
            }
        },
        onLoad() {

        },
        onReady() {
            // this.listenNFCStatus();
			this.getServerData();
        },

        methods: {
            listenNFCStatus() {
                this.main = plus.android.runtimeMainActivity();
                console.log(this.main, 'main')
                var Intent = plus.android.importClass('android.content.Intent');
                var Activity = plus.android.importClass('android.app.Activity');
                var PendingIntent = plus.android.importClass('android.app.PendingIntent');
                var IntentFilter = plus.android.importClass('android.content.IntentFilter');
                NfcAdapter = plus.android.importClass('android.nfc.NfcAdapter');
                this.nfcAdapter = NfcAdapter.getDefaultAdapter(this.main);
                if (this.nfcAdapter == null) {
                    alert("设备不支持NFC！");
                    return;
                }
                if (!this.nfcAdapter.isEnabled()) {
                    alert("请在系统设置中先启用NFC功能！");
                    return;
                }
                var intent = new Intent(this.main, this.main.getClass());
                intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
                this.pendingIntent = PendingIntent.getActivity(this.main, 0, intent, 0);
                var ndef = new IntentFilter("android.nfc.action.TECH_DISCOVERED");
                ndef.addDataType("*/*");
                this.intentFiltersArray = [ndef];
                this.techListsArray = [
                    ["android.nfc.tech.IsoDep"],
                    ["android.nfc.tech.NfcA"],
                    ["android.nfc.tech.NfcB"],
                    ["android.nfc.tech.NfcF"],
                    ["android.nfc.tech.Nfcf"],
                    ["android.nfc.tech.NfcV"],
                    ["android.nfc.tech.NdefFormatable"],
                    ["android.nfc.tech.MifareClassi"],
                    ["android.nfc.tech.MifareUltralight"]
                ];
                plus.globalEvent.addEventListener("newintent", this.handleNewIntent, false);
                plus.globalEvent.addEventListener("pause", this.handlePause, false);
                plus.globalEvent.addEventListener("resume", this.handleResume, false);
                this.nfcAdapter.enableForegroundDispatch(this.main, this.pendingIntent, this.intentFiltersArray, this
                    .techListsArray);
            },

            handleNewIntent() {
                console.log('newintent');
                setTimeout(() => {
                    this.handle_nfc_data1()
                }, 1000);
            },
            handlePause(e) {
                if (this.nfcAdapter) {
                    this.nfcAdapter.disableForegroundDispatch(this.main);
                    console.log('pause');
                }
            },
            handleResume(e) {
                if (this.nfcAdapter) {
                    console.log('resume');
                    this.nfcAdapter.enableForegroundDispatch(this.main, this.pendingIntent, this.intentFiltersArray,
                        this.techListsArray);
                }
            },

            handle_nfc_data1() {
                NdefRecord = plus.android.importClass("android.nfc.NdefRecord");
                NdefMessage = plus.android.importClass("android.nfc.NdefMessage");
                this.main = plus.android.runtimeMainActivity();
                var intent = this.main.getIntent();
                console.log("action type:" + intent.getAction());
                if ("android.nfc.action.TECH_DISCOVERED" == intent.getAction()) {
                    if (this.readyWriteData) {
                        this._write(intent);
                        this.readyWriteData = false;
                    } else if (this.readyRead) {
                        this._read(intent);
                        this.readyRead = false;
                    }
                }
            },

            showToast(msg) {
                plus.nativeUI.toast(msg);
            },

            writeData(intent) {
                console.log(1231);
            },

            _read(intent) {
                console.log('开始读取....');
                try {
                    this.content = "";
                    let tag = plus.android.importClass("android.nfc.Tag");
                    tag = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG);

                    let bytesId = intent.getByteArrayExtra(NfcAdapter.EXTRA_ID);
                    this.intent = intent;
                    console.log("bytesId:" + (bytesId));
                    this.uID = this.bytesToHexString(tag.getId());
                    this.content += "卡片字节数组ID：" + tag.getId() + "<br/>";
                    this.content += "卡片16进制ID：" + this.uID + "<br/>";
                    var tagid = this.reverseTwo(this.bytesToHexString(tag.getId()));
                    this.content += "卡片16进制翻转ID：" + tagid + "<br/>";
                    this.content += "卡片10进制卡号：" + parseInt(tagid, 16) + "<br/>";

                    //读NFC
                    const NfcA = plus.android.importClass('android.nfc.tech.NfcA');
                    let nfcATag = NfcA.get(tag);
                    nfcATag.close();
                    nfcATag.connect();
                    console.log("连接情况shit", nfcATag.isConnected())
                    const READ_COMMAND = [0x30, 0x04]; //从block 4读取数据
                    this.sramData = nfcATag.transceive(READ_COMMAND);
                    setTimeout(() => {
                        console.log(this.sramData, 'this.sramData'); //芯片默认返回16个字节数据 取前三个字节画图

                    }, 2000)

                    this.popShow = false;

                } catch (e) {
                    console.error(e, 'e');
                    //TODO handle the exception  
                }
            },
            readData() {
                this.readyRead = true;
                this.popShow = true;
            },
            bytesToHexString(inarray) {
                var i, j, x;
                var hex = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A",
                    "B", "C", "D", "E", "F"
                ];
                var out = "";
                for (j = 0; j < inarray.length; ++j) {
                    x = parseInt(inarray[j]) & 0xff;
                    i = (x >> 4) & 0x0f;
                    out += hex[i];
                    i = x & 0x0f;
                    out += hex[i];
                }
                return out;
            },

            //将前三个字节转为十进制并且计算电压变化
            HexToDec(inarray) {
                var i, j;
                var out = 0;

                for (i = 0; i < 3; i++) {
                    var Dec;
                    var Hex = inarray[i];
                    for (j = 0; j < 8; j++) //16表示一个十六进制数一共16位，根据自己的实际情况进行修改
                    {
                        if (Hex & 0x01) //判断十六进制数对应的二进制的最后是0还是1
                        {
                            Dec += pow(2, j); // 进行次方运算
                            Hex >>= 1; //这里的移位操作是对十六进制对应的二进制进行操作，不需要我们进行转换
                        } else //如果最后一位不是1
                        {
                            Dec += 0; //则加0
                            Hex >>= 1;
                        }
                    }
                    out += Dec * pow(256, (2 - i));
                }
                return out;

            },
            VoltageCalculate(inarry) {
                var CODEFS = 11184810; //手册规定参考值 0xAAAAA 转换值
                var num1 = 1.0;
                var CODE = HexToDec(this.sramData);
                var VIN = (1400) * (CODE / CODEFS - (num1 / 2)); //电压计算公式
                return VIN; //用VIN画图
            },
            reverseTwo(str) {
                var str1 = "";
                for (var i = 1; i <= str.length; i++) {
                    str1 += str[i - 1];
                    if (i % 2 == 0) {
                        if (i == str.length) {
                            break;
                        }
                        str1 += ":";
                    }
                }
                var str2 = "";
                for (var i = str1.split(":").length - 1; i >= 0; i--) {
                    str2 += str1.split(":")[i];
                }
                return str2;
            },
            getServerData() {
                clearInterval(this.intervalId);
                // 初始化数据
                let res = {
                    categories: [0, 1, 2, 3, 4, 5],
                    series: [{
                        name: "成交量A",
                        lineType: "dash",
                        data: [23, 9, 25, 17, 12, 20]
                    }]
                };
            
                // 使用 setInterval 替换 setTimeout
                this.intervalId = setInterval(() => {
                    // 递增 categories 长度
                    res.categories.push((parseInt(res.categories.slice(-1)[0]) + 1).toString());
            
                    // 递增 series 的 data 长度，并生成随机数
                    res.series[0].data.push(Math.floor(Math.random() * 30) + 1);
            
                    // 使用深拷贝避免引用问题，将服务器返回的数据赋值给图表数据
                    this.chartData = JSON.parse(JSON.stringify(res));
                }, 2000); // 每隔5秒执行一次
            },
            stopGenerateData() {
                clearInterval(this.intervalId); // 清除之前启动的 setInterval
                console.log(`定时器被成功清除，intervalId: ${this.intervalId}`);
            },
            
            rotateChart() {
                this.opts.rotate = !this.opts.rotate;
            }
        },

        //页面关闭
        onUnload() {
            clearInterval(this.intervalId); // 清除setInterval
            // todo 关闭NFC监听
        }
    }
</script>

<style>
    .content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .pop-box {
        padding: 40rpx;
    }
    
	/* 请根据实际需求修改父元素尺寸，组件自动识别宽高 */
	.charts-box {
	    width: 100%;
	    height: 1000rpx;
	}
	.icon-a-appenlarge {
		position: absolute;
		right: -20rpx;
		bottom: 200rpx;
		background: transparent;
		color: #a7c2fa;
	}
</style>