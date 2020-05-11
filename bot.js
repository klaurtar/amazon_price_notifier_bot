const puppeteer = require('puppeteer');
const $ = require('cheerio');
const CronJob = require('cron').CronJob;
const nodemailer = require('nodemailer');

require('dotenv').config();

let itemsToTrack = [];

function Item(url, desiredPrice){
    this.url = url;
    this.desiredPrice = desiredPrice;
}

function addItem(url, desiredPrice){
    var item = new Item(url, desiredPrice);
    itemsToTrack.push(item);
}
addItem('https://www.amazon.com/Molekule-Purifier-Purification-Technology-Silver/dp/B07YT95V42/ref=sr_1_1_sspa?dchild=1&keywords=molekule&qid=1589162634&sr=8-1-spons&psc=1&spLa=ZW5jcnlwdGVkUXVhbGlmaWVyPUEyR003WEsyQVlJM0lGJmVuY3J5cHRlZElkPUEwNjI1NDcyMVJCQ1hJMFUyTFZOMCZlbmNyeXB0ZWRBZElkPUEwODYzMzMzMlozTkZZTERMMVU0UyZ3aWRnZXROYW1lPXNwX2F0ZiZhY3Rpb249Y2xpY2tSZWRpcmVjdCZkb05vdExvZ0NsaWNrPXRydWU=', 800);
addItem('https://www.amazon.com/Xiaowli-Mermaid-Nicolas-Reversible-Decorative/dp/B07GTJ3WK4/ref=sr_1_2?dchild=1&keywords=nicholas%2Bcage%2Bpillow&qid=1589214531&sr=8-2&th=1', 11);


console.log(itemsToTrack);

async function configureBrowser(url) {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.goto(url);
    return page;
}

async function checkPrice(page, desiredPrice, url) {
    
    await page.reload();
    let html = await page.evaluate(() => document.body.innerHTML);
    let itemName = await page.evaluate(() => document.querySelector('#productTitle').innerText);
    // console.log('Here is the HTML:', html);

    $('#priceblock_ourprice', html).each(function() {
        let dollarPrice = $(this).text();
        // console.log(dollarPrice);
        var currentPrice = Number(dollarPrice.replace(/[^0-9.-]+/g,""));

        if(currentPrice < desiredPrice) {
            console.log("Buy " + itemName + " now!!! Price is: " + currentPrice); 
            sendNotification(currentPrice, itemName, url);
        }

    })

    

}

async function startTracking(index) {
        let indexStartTracking = index;
        console.log("url is : " + itemsToTrack[indexStartTracking].url);
        let page = await configureBrowser(itemsToTrack[indexStartTracking].url);
        
        console.log("Index outer scope, " + indexStartTracking)
        let job = new CronJob('*/15 * * * *', function() {
            console.log("Index inner scope, " + indexStartTracking)
            checkPrice(page, itemsToTrack[indexStartTracking].desiredPrice, itemsToTrack[indexStartTracking].url);
        }, null, true, null, null, true);
        job.start();
    
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
      let htmlText = `<a href=\"${url}\">Link to Item</a>`;

      let info = await transporter.sendMail({
          from: '"Amazon Bot" ' + process.env.USER_SENDTO,
          to: process.env.USER_SENDTO,
          subject: itemName + ' price dropped to ' + price,
          text: textToSend,
          html: htmlText
      })

      console.log("Message sent: %s", info.messageId);

}






async function monitor(index){
    let page = await configureBrowser(itemsToTrack[index].url);
    await checkPrice(page, itemsToTrack[index].desiredPrice, itemsToTrack[index].url);
    
}

for(i = 0; i < itemsToTrack.length; i++){
    const index = i;
    startTracking(index);
    monitor(index);
}


