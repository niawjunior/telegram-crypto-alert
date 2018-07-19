const TelegramBot = require('node-telegram-bot-api');
const config = require('./config')
const token = config.token;
const axios = require('axios')
const bot = new TelegramBot(token, {polling: true})
const img_url = 'https://cdn-images-1.medium.com/max/1600/1*Hi39Dv7IfbFyiDpWKG2Zaw.png'

async function main() {
    return await  axios.get(`https://api.coinmarketcap.com/v2/ticker/?convert=THB&limit=10`)
}

bot.onText(/\/start/, (msg) => {
    bot.sendPhoto(msg.chat.id,img_url,{caption : "😍😍 ยินดีต้อนรับ 😍😍 \n "}).then(() => {
        var option = {
            "reply_markup": {
                "keyboard": [["เช็คราคา", "ตั้งค่าการแจ้งเตือน"]]
                }
        }
        bot.sendMessage(msg.chat.id,"\n⚔️⚔️ คุณสมบัติของบอทที่สามารถทำได้ ⚔️⚔️\n\n 1. ตรวจสอบราคาของเหรียญสกุลต่างๆ(20 อันดับแรก) \n 2. ตั้งค่าการการแจ้งเตือน \n\n",option)
    })
})

bot.on('message', (msg) => {
    const send_text = msg.text
    if (send_text.toString().indexOf('เช็คราคา') === 0) {
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