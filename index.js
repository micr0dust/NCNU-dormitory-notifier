const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const notifier = require('node-notifier');
const open = require('open');

//pkg index.js -t node14-win-x64 --public

let lastData;
fs.readFile('./record.json', 'utf8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    lastData = JSON.parse(data);
});
(async() => {
    const browser = await puppeteer.launch({
        executablePath: "./chromium/chrome.exe",
        headless: true,
        //devtools: true
    });
    const page = await browser.newPage();
    try {
        await page.goto('https://www.doc.ncnu.edu.tw/housing/');
    } catch (error) {
        console.log("連線失敗\n");
        console.log(error);
    }
    try {
        //await page.pdf({path: 'google.pdf'});
        await page.waitForSelector('#maincolumn > div.nopad > table > tbody > tr:nth-child(2) > td > form > table > tbody');
        let result = await page.evaluate(async() => {
            let CTitle = [];
            const olimit = document.querySelector('#limit');
            if (!olimit) return;
            let limit = parseInt(olimit.value);
            for (let i = 0; i < limit; i++) {
                const orow = document.querySelector('#maincolumn > div.nopad > table > tbody > tr:nth-child(2) > td > form > table > tbody > tr:nth-child(' + (i + 3) + ')');
                if (!orow) break;
                const onumber = orow.querySelector('td:nth-child(1)');
                const otitle = orow.querySelector('td:nth-child(2) > a');
                let id = parseInt(onumber.innerText);
                let title = otitle.innerText;
                let link = otitle.href;
                if (id && title) CTitle.push({ id: id, title: title, url: link });
            }
            return CTitle;
        });
        for (let i = 0; i < result.length; i++) {
            if (result[i].title == lastData[0].title) break;
            notifier.notify({
                title: result[i].title,
                icon: path.join(__dirname, 'icon.jpg'),
                message: '住服組'
            });
        }
        fs.writeFile('./record.json', JSON.stringify(result), err => {
            if (err) {
                console.error(err);
            }
        });
    } catch (error) {
        console.log(error);
    }
    await browser.close();
})();