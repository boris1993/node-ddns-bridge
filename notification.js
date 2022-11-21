module.exports = {
    sendNotification: sendNotification
};

const https = require("https");
const PUSH_API_URLS = {
    bark: "https://api.day.app",
};

const notificationChannels = [sendByBark];

function sendNotification(hostname, ipAddress) {
    for (let notificationChannel of notificationChannels) {
        notificationChannel(hostname, ipAddress);
    }
}

function sendByBark(hostname, ipAddress) {
    let barkPushKey = process.env.BARK_PUSH_KEY;
    if (!barkPushKey) {
        return;
    }

    console.log("Sending notification via Bark");

    let finalPushUrl = `${PUSH_API_URLS.bark}/${barkPushKey}/IP地址已更新/${hostname}的新IP地址是${ipAddress}`;
    https.get(finalPushUrl, (res) => {
        console.log(`Bark API status code: ${res.statusCode}`);
        res.on('data', (d) => process.stdout.write(d));
    }).on('error', (e) => {
        console.error(e);
    });
}
