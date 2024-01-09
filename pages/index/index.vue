<template>
    <view class="content">
        <!-- <u-popup :show="show" @close="close" @open="open">
            <view>
                <text>请刷卡读取数据</text>
            </view>
        </u-popup>
        <u-button @click="initNFC">打开</u-button> -->
        <button @click="writeData">writeData</button>
        <button @click="readData">readData</button>
        <div v-html="content"></div>
    </view>
</template>

<script>
    var NfcAdapter;
    var NdefRecord;
    var NdefMessage;

    export default {
        data() {
            return {
                waiting: '',
                readyWriteData: false,
                readyRead: false,
                nfcAdapter: null,
                main: null,
                pendingIntent: null,
                intentFiltersArray: [],
                techListsArray: [],
                content: '',
            }
        },
        onLoad() {

        },
        onReady() {
            this.listenNFCStatus();
        },

        methods: {
            listenNFCStatus() {
                this.main = plus.android.runtimeMainActivity();
                console.log(this.main, 'asda')
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
                try {
                    this.content = "";
                    this.waiting.setTitle('请勿移开标签\n正在读取数据...');
                    var tag = plus.android.importClass("android.nfc.Tag");
                    tag = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG);
                    var bytesId = intent.getByteArrayExtra(NfcAdapter.EXTRA_ID);
                    console.log("bytesId:" + (bytesId));
                    this.waiting.close();
                    this.content += "卡片字节数组ID：" + tag.getId() + "<br/>";
                    this.content += "卡片16进制ID：" + this.bytesToHexString(tag.getId()) + "<br/>";
                    var tagid = this.reverseTwo(this.bytesToHexString(tag.getId()));
                    this.content += "卡片16进制翻转ID：" + tagid + "<br/>";
                    this.content += "卡片10进制卡号：" + parseInt(tagid, 16) + "<br/>";

                    console.log(this.content, 'content');

                } catch (e) {
                    console.error(e, 'e');
                    //TODO handle the exception  
                }
            },
            readData() {
                this.readyRead = true;
                this.waiting = plus.nativeUI.showWaiting("请将NFC标签靠近！");
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
            }

        },

        //页面关闭时，关闭NFC监听
        onUnload() {

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

    .logo {
        height: 200rpx;
        width: 200rpx;
        margin-top: 200rpx;
        margin-left: auto;
        margin-right: auto;
        margin-bottom: 50rpx;
    }

    .text-area {
        display: flex;
        justify-content: center;
    }

    .title {
        font-size: 36rpx;
        color: #8f8f94;
    }
</style>