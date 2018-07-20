const TelegramBot = require('node-telegram-bot-api');
const config = require('./config')
const token = config.token;
const axios = require('axios')
const bot = new TelegramBot(token, {polling: true})
const img_url = 'https://github.com/niawjunior/telegram-crypto-alert/blob/master/logo.png?raw=true'
const firebase = require('firebase')
const firebase_config = config.firebase_config;
firebase.initializeApp(firebase_config);

async function main() {
    return await  axios.get(`https://api.coinmarketcap.com/v2/ticker/?convert=THB&limit=10`)
}
async function bitcoin() {
    return await axios.get('https://api.coinmarketcap.com/v2/ticker/1/?convert=THB')
}

bot.onText(/\/start/, (msg) => {
    bot.sendPhoto(msg.chat.id,img_url,{caption : "😍😍 ยินดีต้อนรับ 😍😍 \n "}).then(() => {
        var option = {
            "reply_markup": {
                "keyboard": [["เช็คราคา", "ตั้งค่าการแจ้งเตือน"]]
                }
        }
        user_id = msg.from.id
        bot.sendMessage(msg.chat.id,"\n⚔️⚔️ คุณสมบัติของบอทที่สามารถทำได้ ⚔️⚔️\n\n 1. ตรวจสอบราคาของเหรียญสกุลต่างๆ(20 อันดับแรก) \n 2. การแจ้งเตือน ทุกๆ 10 นาที (ขณะนี้รองรับเฉพาะสกุลเหรียญ Bitcoin) \n\n",option)
    })
})

bot.on('message', (msg) => {
    const check_price = msg.text
    if (check_price.toString().indexOf('เช็คราคา') === 0) {
        bot.sendMessage(msg.chat.id,"พิมพ์ชื่อสกุลเหรียญที่ต้องการตรวจสอบ\n")
    }
})

bot.on('message',(msg) => {
    const symbol = (msg.text).toUpperCase()
    const input_name_upper = (msg.text).toUpperCase()
    main().then(data => {
        for(let i in data.data.data) {
            let symbol_upper = data.data.data[i].symbol
            let name = data.data.data[i].name
            let name_upper = (data.data.data[i].name).toUpperCase()

            if(symbol == symbol_upper || input_name_upper == name_upper) {
                let price_thb = data.data.data[i].quotes.THB.price
                let price_usd = data.data.data[i].quotes.USD.price
                bot.sendMessage(msg.chat.id,`❤️❤️ ${symbol_upper} (${name}) ❤️❤️ \n\n THB = ${price_thb.toLocaleString()} \n USD = ${price_usd}`)
            }
        }
    })
})
bot.on('message', (msg) => {
    const set_alert = msg.text
    if(set_alert.toString().indexOf('ตั้งค่าการแจ้งเตือน') === 0) {
        var option = {
            "reply_markup": {
                "keyboard": [["สมัครรับการแจ้งเตือน", "ยกเลิกรับการแจ้งเตือน"]]
                }
        }
        bot.sendMessage(msg.chat.id,"\n สมัคร หรือ ยกเลิกการแจ้งเตือน \n",option)
    }
})

bot.on('message', (msg) => {
    const set_time = msg.text
    if(set_time.toString().indexOf('สมัครรับการแจ้งเตือน') === 0) {
        firebase.database().ref('Users').child(msg.from.id).update({
            updated_At: Date.now(),
            telegram_id: msg.from.id,
            status: true
        }).then(() => {
            bot.sendMessage(msg.chat.id,"\n สมัครรับการแจ้งเตือนแล้ว \n")
            get_profile(msg.from.id)
        })
    }
})

bot.on('message', (msg) => {
    const set_calcel = msg.text
    if(set_calcel.toString().indexOf('ยกเลิกรับการแจ้งเตือน') === 0) {
        firebase.database().ref('Users').child(msg.from.id).update({
            updated_At: Date.now(),
            telegram_id: msg.from.id,
            status: false
        }).then(() => {
            bot.sendMessage(msg.chat.id,"\n ยกเลิกรับการแจ้งเตือนแล้ว \n")
            get_profile(msg.from.id)
        })
    }
})



get_profile=(user_id)=> {
    setInterval(() => {
    firebase.database().ref('Users').child(user_id).once('value', snap => {
        var telegram_id = snap.key
        if(snap.val().status === true) {
                bitcoin().then(data => {
                    let price_thb = data.data.data.quotes.THB.price
                    let price_usd = data.data.data.quotes.USD.price
                    bot.sendMessage(telegram_id,`❤️❤️ BTC (Bitcoin) ❤️❤️ \n\n THB = ${price_thb.toLocaleString()} \n USD = ${price_usd}`)
                })
            }
        })
    },600000)
}



     



