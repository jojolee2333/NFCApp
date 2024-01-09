# wufeng-nfc 安卓nfc读取M1卡工具类，通过认证扇区密钥KEYA，进行读取

# 使用示例

```
import { initNFC, closeNFC } from '@/uni_modules/wufeng-nfc/js_sdk/nfc.js';

//初始化NFC
initNFC(function(cardNo){
				if(_this.cardNoNfc !== cardNo){
					_this.cardNoNfc = cardNo;
					if(cardNo.length === 12){
						_this.nfcMethod(cardNo);
					}else{
						uni.showToast({
							title: '卡号读取错误，请重刷',
							icon: 'none'
						})
					}
				}else{
					uni.showToast({
						title: '请勿重复刷卡',
						icon: 'none'
					})
				}
			});


//页面关闭时，关闭NFC监听
onUnload() {
			this.cardNoNfc = '';
			closeNFC();
		}

```