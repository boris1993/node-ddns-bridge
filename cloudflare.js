module.exports = {
    handle: handle
};

const https = require("https");

const CLOUDFLARE_API_HOSTNAME = "api.cloudflare.com";

async function handle(zoneId, token, domain, address) {
    if (!zoneId || !token || !domain || !address) {
        return sendBadAgentResponse();
    }

    console.log(`Retrieving the record ID of domain ${domain}`);

    let dns_records_obj = await getCloudFlareRecord(token, zoneId, domain);
    let results = dns_records_obj["result"];

    if (!results) {
        return sendResponse(400, "nohost");
    }

    if (results.length > 1) {
        console.error(`Domain ${domain} has multiple A records, which usually shouldn't happen`);
        return sendBadAgentResponse();
    }

    let { id: domainId, content } = results[0];
    console.log(`Record ID of ${domain} is ${domainId}`);

    if (content === address) {
        console.log("Address not changed. Aborting.");
        return sendResponse(200, "nochg");
    }

    let isSuccess = await updateAddressForRecord(token, zoneId, domainId, domain, address);
    if (!isSuccess) {
        return sendResponse(500, "911");
    }

    return sendGoodResponse();
};

async function getCloudFlareRecord(token, zoneId, domain) {
    let options = buildRequestOptions(token, `/client/v4/zones/${zoneId}/dns_records?type=A&name=${domain}`)
    return await sendGetRequest(options);
}

async function updateAddressForRecord(token, zoneId, domainId, domain, address) {
    console.log(`Updating the address of ${domain} to ${address}`);

    let options = buildRequestOptions(token, `/client/v4/zones/${zoneId}/dns_records/${domainId}`);
    let data = {
        type: "A",
        name: domain,
        content: address
    };

    let isSuccess = await sendPutRequest(options, data);
    return isSuccess;
}

function buildRequestOptions(token, path) {
    return {
        protocol: "https:",
        hostname: CLOUDFLARE_API_HOSTNAME,
        path: path,
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
}

async function sendGetRequest(options) {
    return new Promise((resolve, reject) => {
        https.get(options, (resp) => {
            let data = "";

            resp.on("data", (chunk) => data += chunk);
            resp.on("end", () => {
                let response_obj = JSON.parse(data);

                resolve(response_obj);
            });
        }).on("error", (err) => {
            console.error(err);
            reject(err);
        }).end();
    });
}

async function sendPutRequest(options, params) {
    let paramsJson = JSON.stringify(params);

    options.method = "PUT";
    options.headers["Content-Type"] = "application/json";
    options.headers["Content-Length"] = paramsJson.length;

    return new Promise((resolve, reject) => {
        let request = https.request(options, (resp) => {
            let data = "";

            resp.on("data", (chunk) => data += chunk);
            resp.on("end", () => {
                let response_obj = JSON.parse(data);

                resolve(response_obj["success"]);
            });
        }).on("error", (err) => {
            console.error(err);
            reject(err);
        });

        request.write(paramsJson);
        request.end();
    });
}

function sendGoodResponse() {
    return sendResponse(200, "good");
}

function sendBadAgentResponse() {
    return sendResponse(400, "badagent");
}

function sendResponse(status, body) {
    return [status, body];
}
