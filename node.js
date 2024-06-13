const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const puppeteer = require('puppeteer'); 

const app = express();

app.use(bodyParser.json());
app.use(cors()); // 允许任何前端域名请求，可以根据自身需求更改

// 实时获取进度值
async function fetchProgressValue() {
    let browser;
    try {
        // 启动 Puppeteer 浏览器，禁用 sandbox 模式
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto('https://你要监控的站点', { waitUntil: 'networkidle2' });

        // 等待目标元素加载
        await page.waitForSelector('你要监控的html元素，这里填写元素的class');
        
        // 获取进度值
        const progressValue = await page.$eval('你要监控的html元素，这里填写元素的class', element => element.textContent.trim());
        console.log(`Fetched progress value: ${progressValue}`); //这里是监控的爱发电的发电目标进度，可以根据自身需求修改这里的文字
        
        return progressValue;
    } catch (error) {
        console.error('Error fetching progress value:', error);
        return 'N/A';
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// 处理前端请求并实时获取进度值
app.get('/progress-events', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    console.log('Client connected for progress events');

    // 实时获取进度值并发送
    const progressValue = await fetchProgressValue();
    res.write(`data: ${JSON.stringify({ progress: progressValue })}\n\n`);

    // 关闭连接
    req.on('close', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 30001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
