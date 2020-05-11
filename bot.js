const puppeteer = require('puppeteer');
const $ = require('cheerio');
const CronJob = require('cron').CronJob;
const nodemailer = require('nodemailer');

require('dotenv').config();

const url = 'https://www.amazon.com/Molekule-Purifier-Purification-Technology-Silver/dp/B07YT95V42/ref=sr_1_1_sspa?dchild=1&keywords=molekule&qid=1589162634&sr=8-1-spons&psc=1&spLa=ZW5jcnlwdGVkUXVhbGlmaWVyPUEyR003WEsyQVlJM0lGJmVuY3J5cHRlZElkPUEwNjI1NDcyMVJCQ1hJMFUyTFZOMCZlbmNyeXB0ZWRBZElkPUEwODYzMzMzMlozTkZZTERMMVU0UyZ3aWRnZXROYW1lPXNwX2F0ZiZhY3Rpb249Y2xpY2tSZWRpcmVjdCZkb05vdExvZ0NsaWNrPXRydWU=';

async function configureBrowser() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    return page;
}

async function checkPrice(page) {
    
    await page.reload();
    let html = await page.evaluate(() => document.body.innerHTML);
    let itemName = await page.evaluate(() => document.querySelector('#productTitle').innerText);
    // console.log('Here is the HTML:', html);

    $('#priceblock_ourprice', html).each(function() {
        let dollarPrice = $(this).text();
        // console.log(dollarPrice);
        var currentPrice = Number(dollarPrice.replace(/[^0-9.-]+/g,""));

        if(currentPrice < 750) {
            console.log("Buy " + itemName + " now!!! Price is: " + currentPrice); 
            sendNotification(currentPrice, itemName);
        }

    })

    

}

async function startTracking() {
    const page = await configureBrowser();

    let job = new CronJob('0 */12 * * *', function() {
        checkPrice(page);
    }, null, true, null, null, true);
    job.start();
}

async function sendNotification(price, itemName){

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

startTracking();

async function monitor(){
    let page = await configureBrowser();
    await checkPrice(page);
}

monitor();
