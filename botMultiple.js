const puppeteer = require('puppeteer');
const $ = require('cheerio');
const CronJob = require('cron').CronJob;
const nodemailer = require('nodemailer');

require('dotenv').config();

let itemsToTrack = [];

function Item(url, desiredPrice, htmlSelector){
    this.url = url;
    this.desiredPrice = desiredPrice;
    this.htmlSelector = htmlSelector;
}

function addItem(url, desiredPrice, htmlSelector){
    var item = new Item(url, desiredPrice, htmlSelector);
    itemsToTrack.push(item);
}
addItem('https://www.amazon.com/Cat-Butt-Tissue-Holder-Standard/dp/B079618L3W/ref=sr_1_1?dchild=1&keywords=what+on+earth+cat+butt&qid=1589302676&sr=8-1', 40, '#priceblock_saleprice');
addItem('https://www.amazon.com/Xiaowli-Mermaid-Nicolas-Reversible-Decorative/dp/B07GTJ3WK4/ref=sr_1_2?dchild=1&keywords=nicholas%2Bcage%2Bpillow&qid=1589214531&sr=8-2&th=1', 11, '#priceblock_saleprice');
addItem('https://www.amazon.com/Rubies-Old-Lady-Wig-Pets/dp/B00WBBD9H2/ref=sr_1_5?dchild=1&keywords=rubies+costume+company+pet+wig+blonde&qid=1589302779&sr=8-5', 12, '#priceblock_ourprice');

console.log(itemsToTrack);


(async () => {
    for(const item of itemsToTrack){
        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();
        await page.goto(item.url);
    
        async function startTracking(item) {
            
            //console.log("Index outer scope, " + itemsToTrack.indexOf(item))
            let job = new CronJob('*/15 * * * *', async function() {
                //console.log("Index inner scope, " + itemsToTrack.indexOf(item))
                await checkPrice(page, item.desiredPrice, item.url);
            }, null, true, null, null, true);
            await job.start();
        
    }

    async function sendNotification(price, itemName, url){

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.USER_EMAIL, // generated ethereal user
              pass: process.env.USER_PASSWORD // generated ethereal password
            }
          });
          
          let textToSend = 'Price dropped to ' + price;
          let htmlText = `<a href=\"${url}\">Link to Item</a><p>Auto-sent to you with <3 by your amazing boyfriend</p>`;
    
          let info = await transporter.sendMail({
              from: '"Amazon Bot" ' + process.env.USER_SENDTO,
              to: process.env.USER_SENDTO,
              subject: itemName + ' price dropped to ' + price,
              text: textToSend,
              html: htmlText
          })
    
          console.log("Message sent: %s", info.messageId);
    
    }

    async function checkPrice(page, desiredPrice, url) {
        //await page.reload();
        let html = await page.evaluate(() => document.body.innerHTML);
        let itemName = await page.evaluate(() => document.querySelector('#productTitle').innerText);
        console.log(itemName);
    
        $(item.htmlSelector, html).each(async function() {
            let dollarPrice = $(this).text();
            console.log(dollarPrice);
            // console.log(dollarPrice);
            var currentPrice = Number(dollarPrice.replace(/[^0-9.-]+/g,""));
    
            if(currentPrice < desiredPrice) {
                console.log("Buy " + itemName + " now!!! Price is: " + currentPrice); 
                await sendNotification(currentPrice, itemName, url);
            }
    
        })
    }

    async function init(){
        startTracking(item);
    }
    init();
    
    await page.waitFor(10000);
    await browser.close();
}
  })();
