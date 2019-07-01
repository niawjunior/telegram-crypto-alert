const TelegramBot = require('node-telegram-bot-api');
const config = require('./config')
const _ = require('lodash')
const token = config.token;
const cron = require('node-cron')
const axios = require('axios')
var WAValidator = require('wallet-address-validator');
const bot = new TelegramBot(token, {
    polling: true
})
const firebase = require('firebase')
const firebase_config = config.firebase_config;
firebase.initializeApp(firebase_config);

const main = async()=> {
    return await axios.get(`https://api.coinmarketcap.com/v2/ticker/?convert=THB&limit=100`)
}
const key = [["เช็คราคา 🔎"], ["Top 10 อันดับแรก 🚀"], ["เช็คยอดคงเหลือ 💰"], ["รับการแจ้งเตือน 💌"], ["ยกเลิกการแจ้งเตือน ❌"], ["อัพเดท เวอร์ชั่น 🛠 (/start)"]]
const keyArr = [];

bot.onText(/\/start/, (msg) => {
        let option = {
            "reply_markup": {
                "keyboard": key
            }
        }
        user_id = msg.from.id
        bot.sendMessage(msg.chat.id, "\n⚔️⚔️ คุณสมบัติ ⚔️⚔️\n\n 1. ตรวจสอบราคาสกุลเหรียญต่างๆ (Top 100) อ้างอิงจาก coinmarketcap \n 2. เช็คยอดคงเหลือ (Bitcoin, Ethereum) \n 3. รายชื่อ Top 10 เหรียญอันดับแรก \n 4. ตั้งค่าการแจ้งเตือน [10, 20, 30, 60] นาที (Top 100) \n\n", option)
})

bot.on('message', (msg) => {
    const check_price = msg.text
    if (check_price.toString().indexOf('เช็คราคา 🔎') === 0) {
        bot.sendMessage(msg.chat.id, "พิมพ์ชื่อสกุลเหรียญที่ต้องการตรวจสอบ แล้วตามด้วยเครื่องหมาย ? (ยกตัวอย่างเช่น btc? หรือ Bitcoin?)\n")
    }
})


bot.on('message', (msg) => {
    const check_balance = msg.text
    if (check_balance.toString().indexOf('เช็คยอดคงเหลือ 💰') === 0) {
        bot.sendMessage(msg.chat.id, "พิมพ์เครื่องหมาย ^ แล้วตามด้วยที่อยู่วอลเล็ท ที่คุณต้องการตรวจสอบ เช่น ^0xcf4ca355ec55724dec46404b360bc00e516f6e8f\n ")
    }
})

async function check_ethereum_balance (wallet) {
   return await axios.get(`https://api.etherscan.io/api?module=account&action=balance&address=${wallet}&tag=latest&apikey=RIV89WHJKBBAS75BWT9QGNUPN8DST95H5P`)
}

async function check_bitcoin_balance (wallet) {
    return await axios.get(`https://blockexplorer.com/api/addr/${wallet}/balance`)
 }

bot.on('message', (msg) => {
    [...key].forEach(i => {
    keyArr.push(...i);
    })

    const inputText = msg.text

    if (!keyArr.includes(inputText)) {
        if (inputText.charAt(0) === '^') {
            const wallet = inputText.slice(1);
            if (check_wallet(wallet) === 'error') {
                bot.sendMessage(msg.chat.id, 'รูปแบบวอลเล็ทไม่ถูกต้อง\n');
            } else {
                if(check_wallet(wallet) === 'BTC') {
                    check_bitcoin_balance(wallet).then(data => {
                        var balance = data.data / 100000000
                        bot.sendMessage(msg.chat.id, `ยอดคงเหลือ: ${balance.toFixed(3)} BTC\n`)
                    })
                } 
                if(check_wallet(wallet) === 'ETH') {
                    check_ethereum_balance(wallet).then(data => {
                        var balance = data.data.result / 10e17
                        bot.sendMessage(msg.chat.id, `ยอดคงเหลือ: ${balance.toFixed(3)} ETH\n`)
                    })
                }
            }
        }

        if(inputText.charAt(inputText.length -1) === '?') {
            const input_name_upper = (inputText.slice(0, inputText.length -1).replace(/\s/g, '')).toUpperCase()
            let search_name_array = []
            let search_symbol_array = []
            let search_coin = []
            main().then(data => {
                for (let i in data.data.data) {
                    const name = (data.data.data[i].name).toUpperCase()
                    const symbol = (data.data.data[i].symbol).toUpperCase()
                    const rank = data.data.data[i].rank
                    let thb = data.data.data[i].quotes.THB.price
                    let usd = data.data.data[i].quotes.USD.price
                    let percent_change_24h = data.data.data[i].quotes.USD.percent_change_24h
                    search_name_array.push(name)
                    search_symbol_array.push(symbol)
                    search_coin.push({
                        name: name,
                        symbol: symbol,
                        rank: rank,
                        thb: thb,
                        usd: usd,
                        percent_change_24h: percent_change_24h
                    })
                }
            }).then(() => {
                if (search_name_array.includes(input_name_upper) === true || search_symbol_array.includes(input_name_upper) === true) {
                    search_coin.map((item) => {
                        if(item.name === input_name_upper || item.symbol === input_name_upper) {
                            let price_thb = item.thb
                            let price_usd = item.usd
                            let percent_change_24h = item.percent_change_24h
                            bot.sendMessage(msg.chat.id, `❤️ Rank. ${item.rank} ${item.symbol} (${item.name}) ❤️ \n\n THB = ${price_thb.toLocaleString()} \n USD = ${price_usd.toLocaleString()} \n Change(24) = ${percent_change_24h}%`)
                        }
                    })
    
                } else {
                    bot.sendMessage(msg.chat.id, `\n ไม่พบเหรียญที่คุณต้องการ กรุณาลองใหม่อีกครั้ง \n`)
                }
            })
        }

        if (inputText.toString().charAt(0) === '/' && inputText.toString().includes('/start') === false) {
            let coin = (inputText.toString().replace(/[^\w\s]/gi, '')).toUpperCase()
            main().then((data) => {
                let coin_name = []
                let coin_symbol = []
                for (let i in data.data.data) {
                    const name = (data.data.data[i].name).toUpperCase()
                    const symbol = (data.data.data[i].symbol).toUpperCase()
                    coin_name.push(name)
                    coin_symbol.push(symbol)
                }
                if (coin_name.includes(coin) === true || coin_symbol.includes(coin) === true) {
                    firebase.database().ref('Users').child(msg.from.id).update({
                        updated_At: Date.now(),
                        telegram_id: msg.from.id,
                        status: true,
                        coin: coin
                    }).then(() => {
                        bot.sendMessage(msg.chat.id, `\n สมัครรับการแจ้งเตือนราคา ${coin} แล้ว 🎉\n`)
                    })
                } else {
                    bot.sendMessage(msg.chat.id, `\n ไม่พบเหรียญที่คุณต้องการ กรุณาลองใหม่อีกครั้ง \n`)
                }
            })
        }
    } else {

        if (inputText.toString().indexOf('Top 10 อันดับแรก 🚀') === 0) {
            let data_rank = []
            main().then(data => {
                for (let i in data.data.data) {
                    data_rank.push({
                        rank: data.data.data[i].rank,
                        name: data.data.data[i].name,
                        thb: data.data.data[i].quotes.THB.price,
                        usd: data.data.data[i].quotes.USD.price,
                        percent_change_24h: data.data.data[i].quotes.USD.percent_change_24h
                    })
                }
            }).then(() => {
                data_rank = _.orderBy(data_rank, ['rank'], ['asc'])
                data_rank.splice(-90)
                let table = ''
                data_rank.map(item => {
                    let price_thb = item.thb
                    let price_usd = item.usd
    
                    gen_rank_icon=(rank)=> {
                        if (rank == 1) {
                            return '🥇'
                        } else if (rank == 2) {
                            return '🥈'
                        } else if (rank == 3) {
                            return '🥉'
                        } else {
                            return '🎗'
                        }
                    }
                  
                    if (item.percent_change_24h.toString().charAt(0) == '-') {
                        var icon_percent = '👇'
                    } else {
                        var icon_percent = '👆'
                    }
                    return table += `${item.rank}. ${gen_rank_icon(item.rank)} ${item.name} THB: ${price_thb.toLocaleString()} บาท USD: ${price_usd.toLocaleString()} ดอลลาร์ Change(24h): ${item.percent_change_24h}% ${icon_percent} \n\n`
                })
                bot.sendMessage(msg.chat.id, `\n ${table} \n`)
            })
        }

        if (inputText.toString().indexOf('รับการแจ้งเตือน 💌') === 0) {
            bot.sendMessage(msg.chat.id, "\n พิมพ์เครื่องหมาย / แล้วตามด้วยชื่อเหรียญที่ต้องการ (ยกตัวอย่างเช่น /btc หรือ /Bitcoin) \n แล้วตามด้วยเวลา [10, 20, 30, 60] นาที ")
        }

        if (inputText.toString().indexOf('ยกเลิกการแจ้งเตือน ❌') === 0) {
            firebase.database().ref('Users').child(msg.from.id).update({
                updated_At: Date.now(),
                telegram_id: msg.from.id,
                status: false
            }).then(() => {
                bot.sendMessage(msg.chat.id, "\n ยกเลิกการแจ้งเตือนแล้ว \n")
            })
        }
    }
})

// wallet validator
function check_wallet(address) {
    var btc = WAValidator.validate(address, 'BTC');
    var eth = WAValidator.validate(address, 'ETH');

    if(btc) {
        return "BTC"
    }
    if(eth) {
        return "ETH"
    }
    if (!btc && !eth) {
        return 'error'
    }
}

cron.schedule('0 */10 * * * * ', function () {
    firebase.database().ref('Users').on('child_added', snap => {
        if (snap.val().status === true) {
            const select_coin = snap.val().coin
            const id = snap.val().telegram_id
                main().then(data => {
                    for (let i in data.data.data) {
                        const name = (data.data.data[i].name).toUpperCase()
                        const symbol = (data.data.data[i].symbol).toUpperCase()
                        if (select_coin === name || select_coin === symbol) {
                            let price_thb = data.data.data[i].quotes.THB.price
                            let price_usd = data.data.data[i].quotes.USD.price
                            let percent_change_24h = data.data.data[i].quotes.USD.percent_change_24h
                            bot.sendMessage(id, `🔔 ${symbol} (${name}) 🔔 \n\n THB = ${price_thb.toLocaleString()} บาท \n USD = ${price_usd.toLocaleString()} ดอลลาร์ \n Change(24) = ${percent_change_24h}%`).then(() => {
                                console.log('success')
                            })
                            .catch(() => {
                                return false
                            })
                        }
                    }
                }).catch(() => {
                    console.log('not found')
                })
        }
    })
})