<template>
    <view class="main-box">
        <u-popup :show="show" @close="close" @open="open" mode="center">
            <view class="pop-box">
                <text>请刷卡读取数据</text>
            </view>
        </u-popup>
        <u-button @click="show = true">开始读取</u-button>
        <view class="info-list">
            <span>bind_code：{{formData.bind_code}}</span>
            <span>tagid：{{formData.tagid}}</span>
        </view>
    </view>
</template>

<script>
    var NfcAdapter;
    var MifareClassic;

    export default {
        data() {
            return {
                show: false,
                formData: {
                    bind_code: '',
                    tagid: '',
                    time: null,
                    show: false,

                }
            }
        },
        methods: {
            close() {
                this.show = false
                // console.log('close');
            },
            open() {
                //开启阴影遮罩前检查NFC状态
                var main = plus.android.runtimeMainActivity();
                NfcAdapter = plus.android.importClass('android.nfc.NfcAdapter');
                var _nfcAdapter = NfcAdapter.getDefaultAdapter(main);
                if (_nfcAdapter == null) {
                    uni.showToast({
                        icon: "error",
                        title: "该设备不支持NFC",
                        duration: 5000
                    })
                } else if (_nfcAdapter.isEnabled() == false) {
                    uni.showToast({
                        icon: "error",
                        title: "NFC功能未打开",
                        duration: 5000
                    })
                } else {
                    //初始化ncf 并开启监听
                    this.NFCInit();
                }

            },
            change(e, s) {
                if (!e.show) {
                    //销毁监听事件
                    plus.globalEvent.removeEventListener("newintent", false);
                }
            },
            // nfc入口
            NFCInit() {
                try {

                    var main = plus.android.runtimeMainActivity();
                    //console.log(main);
                    var Intent = plus.android.importClass('android.content.Intent');
                    // console.log(Intent);
                    var Activity = plus.android.importClass('android.app.Activity');
                    //console.log(Activity);
                    var PendingIntent = plus.android.importClass('android.app.PendingIntent');
                    // console.log(PendingIntent);
                    var IntentFilter = plus.android.importClass('android.content.IntentFilter');
                    var NdefRecord = plus.android.importClass('android.nfc.NdefRecord')
                    var NdefMessage = plus.android.importClass('android.nfc.NdefMessage')
                    MifareClassic = plus.android.importClass("android.nfc.tech.MifareClassic");

                    NfcAdapter = plus.android.importClass('android.nfc.NfcAdapter');

                    var _nfcAdapter = NfcAdapter.getDefaultAdapter(main);


                    var ndef = new IntentFilter(
                        'android.nfc.action.NDEF_DISCOVERED'); //NfcAdapter.ACTION_NDEF_DISCOVERED

                    var tag = new IntentFilter('android.nfc.action.TAG_DISCOVERED'); //NfcAdapter.ACTION_TECH_DISCOVERED
                    console.log(tag);
                    var tech = new IntentFilter('android.nfc.action.TECH_DISCOVERED');

                    var intentFiltersArray = [ndef, tag, tech];

                    var techListsArray = [
                        ['android.nfc.tech.Ndef'],
                        ['android.nfc.tech.IsoDep'],
                        ['android.nfc.tech.NfcA'],
                        ['android.nfc.tech.NfcB'],
                        ['android.nfc.tech.NfcF'],
                        ['android.nfc.tech.Nfcf'],
                        ['android.nfc.tech.Nfef'],
                        ['android.nfc.tech.Ndef'],
                        ['android.nfc.tech.NfcV'],
                        ['android.nfc.tech.NdefFormatable'],
                        ['android.nfc.tech.MifareClassi'],
                        ['android.nfc.tech.MifareUltralight']
                    ];
                    var _intent = new Intent(main, main.getClass());
                    // console.log(_intent);
                    _intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);

                    var pendingIntent = PendingIntent.getActivity(main, 0, _intent, 0);
                    var that = this;
                    //监听贴卡到手机事件 
                    plus.globalEvent.addEventListener('newintent', e => {
                        //获取ic卡数据
                        that.NFCReadUID()
                        //销毁监听事件
                        plus.globalEvent.removeEventListener("newintent", false);
                    });
                    if (_nfcAdapter == null) {} else if (_nfcAdapter.isEnabled() == false) {} else {
                        _nfcAdapter.enableForegroundDispatch(main, pendingIntent, IntentFilter, techListsArray);

                    }
                } catch (e) {
                    //TODO handle the exception
                }
            },
            //获取ic卡数据
            NFCReadUID() {
                var main = plus.android.runtimeMainActivity();
                var _intent = main.getIntent();
                var _action = _intent.getAction();
                console.log("action type:" + _action);

                if (NfcAdapter.ACTION_NDEF_DISCOVERED == _action || NfcAdapter.ACTION_TAG_DISCOVERED == _action ||
                    NfcAdapter.ACTION_TECH_DISCOVERED == _action) {
                    console.log("选择的调动标签", _intent.getAction())
                    var Tag = plus.android.importClass('android.nfc.Tag');
                    var bind_codes;
                    var tagFromIntent = _intent.getParcelableExtra(NfcAdapter.EXTRA_TAG);
                    console.log("TAG", tagFromIntent)
                    var Ndef = plus.android.importClass("android.nfc.tech.Ndef")
                    var ndef = Ndef.get(tagFromIntent)

                    var NfcA = plus.android.importClass("android.nfc.tech.NfcV")
                    console.log("NfcV", NfcA)
                    var test_A = NfcA.get(tagFromIntent)
                    console.log("get", test_A)
                    if(test_A) {
                        test_A.close();
                        test_A.connect();
                        console.log("连接情况", test_A.isConnected())
                    }
                    
                    var tagUid = tagFromIntent.getId()

                    // 使用NfcV扇区读取，未完善
                    // var blockAddress =127;//块地址
                    // var blocknum = 5	
                    // var cmd = [];
                    // cmd[0] = 0x22;
                    // cmd[1] = 0x23;
                    // for (var i in tagUid) {
                    // 		console.log("传ID:",tagUid[i]);  
                    // 		cmd.push(tagUid[i]);
                    // }
                    // cmd[10] = blockAddress & 0x0ff;
                    // cmd[11] = (blocknum - 1) & 0x0ff;
                    // console.log('cmd',cmd);
                    // var response = test_A.transceive(cmd);
                    // console.log("读取数据：",response)
                    // var str1 = ""
                    // var str2 = ""
                    // str1 = this.Bytes2HexString(response);
                    // console.log("转化为1",str1)
                    // str2 = this.utf8to16(this.hexToString(str1));
                    // console.log("转化为2:",str2)

                    var bind_code = _intent.getByteArrayExtra(NfcAdapter.EXTRA_ID);
                    // ic卡号 进制转换 
                    bind_codes = this.Bytes2HexString(bind_code);

                    //使用NDEF读取有效记录
                    var Parcelable = plus.android.importClass("android.os.Parcelable");
                    // var rawMsgs = _intent.getParcelableArrayExtra(NfcAdapter.EXTRA_NDEF_MESSAGES);
                    var rawMsgs = _intent.getParcelableArrayExtra("android.nfc.extra.NDEF_MESSAGES");

                    if (rawMsgs != null) {
                        console.log("读取MSG", rawMsgs)
                        console.log("MSG[0]", rawMsgs[0])
                        try {
                            var records = rawMsgs[0].getRecords();
                            var result = records[0].getPayload();
                            console.log("result", result)
                            var s = plus.android.newObject("java.lang.String", result);
                            console.log(s);

                        } catch (e) {
                            console.log("错误:", e)
                        }
                    } else {
                        console.log("非NDEF，无法读取MSG")
                    }

                    this.formData.bind_code = bind_codes
                    var tagid = this.reverseTwo(this.bytesToHexString(tagFromIntent.getId()));
                    let icId = parseInt(tagid, 16) + '';
                    //当ic卡号不到10位的时候 前面自动添加0  补齐10位
                    icId = icId.length < 10 ? (Array(10).join(0) + icId).slice(-10) : icId;
                    if (icId) {
                        const shitObj = {
                            tagid: icId,
                            action: _action,
                            Tag: Tag,
                            tagFromIntent: tagFromIntent,
                            rawMsgs: s,
                            bind_code: bind_code,
                        };
                        console.log(shitObj, 'shitObj');
                        this.formData.tagid = icId;
                        // this.$emit("changeNfc", shitObj)
                    } else {
                        uni.showToast({
                            title: "读取数据失败,请重新读取",
                            icon: 'none'
                        })
                    }
                    //关闭遮罩
                    this.show = false;
                }
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

            //将byte[] 转为Hex，
            Bytes2HexString(arrBytes) {
                var str = '';
                for (var i = 0; i < arrBytes.length; i++) {
                    var tmp;
                    var num = arrBytes[i];
                    if (num < 0) {
                        //Java中数值是以补码的形式存在的，应用程序展示的十进制是补码对应真值。补码的存在主要为了简化计算机底层的运算，将减法运算直接当加法来做
                        tmp = (255 + num + 1).toString(16);
                    } else {
                        tmp = num.toString(16);
                    }
                    if (tmp.length == 1) {
                        tmp = '0' + tmp;
                    }
                    str += tmp;
                }
                return str;
            },
            byteToString(arr) {
                if (typeof arr === 'string') {
                    return arr;
                }
                var str = '',
                    _arr = arr;
                for (var i = 0; i < _arr.length; i++) {
                    var one = _arr[i].toString(2),
                        v = one.match(/^1+?(?=0)/);
                    if (v && one.length == 8) {
                        var bytesLength = v[0].length;
                        var store = _arr[i].toString(2).slice(7 - bytesLength);
                        for (var st = 1; st < bytesLength; st++) {
                            store += _arr[st + i].toString(2).slice(2);
                        }
                        str += String.fromCharCode(parseInt(store, 2));
                        i += bytesLength - 1;
                    } else {
                        str += String.fromCharCode(_arr[i]);
                    }
                }
                return str;
            },
            hexToString(str) {
                var val = "",
                    len = str.length / 2;
                for (var i = 0; i < len; i++) {
                    val += String.fromCharCode(parseInt(str.substr(i * 2, 2), 16));
                }
                console.log(val, '16进制转字符串')
                // this.utf8to16(val);
                return val
            },
            //处理中文乱码问题
            utf8to16(str) {
                var that = this
                var out, i, len, c;
                var char2, char3;
                out = "";
                len = str.length;
                i = 0;
                while (i < len) {
                    c = str.charCodeAt(i++);
                    switch (c >> 4) {
                        case 0:
                        case 1:
                        case 2:
                        case 3:
                        case 4:
                        case 5:
                        case 6:
                        case 7:
                            out += str.charAt(i - 1);
                            break;
                        case 12:
                        case 13:
                            char2 = str.charCodeAt(i++);
                            out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                            break;
                        case 14:
                            char2 = str.charCodeAt(i++);
                            char3 = str.charCodeAt(i++);
                            out += String.fromCharCode(((c & 0x0F) << 12) |
                                ((char2 & 0x3F) << 6) |
                                ((char3 & 0x3F) << 0));
                            break;
                    }
                }
                console.log(out, 'out')
                return out;

            },


        },
    }
</script>

<style lang="scss" scoped>
    .main-box {
        padding: 40rpx;
        .pop-box {
            padding: 40rpx;
            border-radius: 20rpx;
        }
    }
    .info-list {
        display: flex;
        flex-direction: column;
    }
</style>