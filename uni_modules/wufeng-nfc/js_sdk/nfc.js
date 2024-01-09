let NfcAdapter;
let nfc;
let nfcCallback;

export function initNFC(callback) {
	if (uni.getSystemInfoSync().platform == 'android') {
		nfcCallback = callback;
		init();
	}
}

export function closeNFC() {
	nfcCallback = null;
	if (uni.getSystemInfoSync().platform == 'android') {
		close();
	}
}

function init() {
	try {
		let main = plus.android.runtimeMainActivity();
		let Intent = plus.android.importClass('android.content.Intent');
		let Activity = plus.android.importClass('android.app.Activity');
		let PendingIntent = plus.android.importClass('android.app.PendingIntent');
		let IntentFilter = plus.android.importClass('android.content.IntentFilter');
		NfcAdapter = plus.android.importClass('android.nfc.NfcAdapter');
		nfc = NfcAdapter.getDefaultAdapter(main);

		if (nfc == null) {
			uni.showToast({
				title: '设备不支持NFC！',
				icon: 'none'
			})
			return;
		}

		if (!nfc.isEnabled()) {
			uni.showToast({
				title: '请在系统设置中先启用NFC功能！',
				icon: 'none'
			});
			return;
		}

		let intent = new Intent(main, main.getClass());
		intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
		let pendingIntent = PendingIntent.getActivity(main, 0, intent, 0);
		let ndef = new IntentFilter("android.nfc.action.TECH_DISCOVERED");
		let tag = new IntentFilter('android.nfc.action.TAG_DISCOVERED');
		ndef.addDataType("*/*");
		let intentFiltersArray = [ndef, tag];
		let techListsArray = [
			["android.nfc.tech.MifareClassic"],
			["android.nfc.tech.MifareUltralight"]
		];
		plus.globalEvent.addEventListener("newintent",
			function() {
				readCardNo();
			}, false);
		plus.globalEvent.addEventListener("pause", function(e) {
			if (nfc) {
				nfc.disableForegroundDispatch(main);
			}
		}, false);
		plus.globalEvent.addEventListener("resume", function(e) {
			if (nfc) {
				nfc.enableForegroundDispatch(main, pendingIntent, intentFiltersArray, techListsArray);
			}
		}, false);
		nfc.enableForegroundDispatch(main, pendingIntent, intentFiltersArray, techListsArray);
	} catch (e) {
		console.error(e);
	}
}

/**
 * 读取卡号
 */
function readCardNo() {
	let m1;
	try {
		let main = plus.android.runtimeMainActivity();
		let intent = main.getIntent();
		console.log("intent.getAction()", intent.getAction());
		if (intent.getAction()) {
			let tag = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG);
            console.log("intent.getAction2", tag);
			let MifareClassic = plus.android.importClass("android.nfc.tech.MifareClassic");
			m1 = MifareClassic.get(tag);
			m1.connect();
			if (m1.isConnected()) {
				let sector = 1;
				let result = m1.authenticateSectorWithKeyA(sector, hexStringToByteArray("B193C384D576"));
				if (result) {
					let blockIndex = m1.sectorToBlock(sector);
					let data = m1.readBlock(blockIndex);
					let cardNo = byteArrayToHexString(data);
					if(nfcCallback){
						nfcCallback(cardNo);
					}
				}else{
					uni.showToast({
						title: "密钥认证错误",
						icon: 'none'
					});
				}
			}else{
				uni.showToast({
					title: "寻卡失败",
					icon: 'none'
				});
			}
		}
	} catch (e) {
		uni.showToast({
			title: "读卡失败",
			icon: 'none'
		});
	} finally {
		if (m1 != null) {
			try {
				m1.close();
			} catch (e) {
				console.log("关闭标签失败");
			}
		}
	}
}

function close() {
	if (nfc) {
		let main = plus.android.runtimeMainActivity();
		nfc.disableForegroundDispatch(main);
	}
}

//Key处理函数  
function hexStringToByteArray(key) {
	let hexA = new Array();
	let pos = 0;
	let len = key.length / 2;
	for (let i = 0; i < len; i++) {
		let s = key.substr(pos, 2);
		let v = parseInt(s, 16);
		if (v >= 128)
			v = v - 256;
		hexA.push(v);
		pos += 2;
	}
	return hexA;
}

//数组转字符串
function byteArrayToHexString(data) {
	let i, j, inn;
	let hex = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
	let out = '';
	for (j = 0; j < data.length; ++j) {
		inn = data[j] & 0xff;
		i = (inn >>> 4) & 0x0f;
		out += hex[i];
		i = inn & 0x0f;
		out += hex[i];
	}
	return out;
}