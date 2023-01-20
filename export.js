const xml2js = require('xml2js');
const Redis = require('ioredis');
const redis = new Redis();

const fs = require('fs');

const readXML = (xmlPath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(xmlPath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};

const parseXML = (xml) => {
    return new Promise((resolve, reject) => {
        xml2js.parseString(xml, (err, json) => {
            if (err) {
                reject(err);
            } else {
                resolve(json);
            }
        });
    });
};

const getSubdomains = (json) => {
    return json.config.subdomains[0].subdomain;
};

const getCookies = (json) => {
    const cookies = {};
    json.config.cookies[0].cookie.forEach((c) => {
        const key = `cookie:${c.$.name}:${c.$.host}`;
        cookies[key] = c._;
    });
    return cookies;
};

// take subdomains and cookies and store them in redis 
// the subdomains in a key called 'subdomains' and the cookies in keys called "cookie:%NAME%:%HOST%"
const storeData = async (subdomains, cookies) => {
    await redis.set('subdomains', JSON.stringify(subdomains));
    await redis.mset(cookies);
};

const exportXML = async (xmlPath) => {
    try {
        const xml = await readXML(xmlPath);
        const json = await parseXML(xml);
        const subdomains = getSubdomains(json);
        const cookies = getCookies(json);
        await storeData(subdomains, cookies);
        console.log('Data exported to Redis successfully');
    } catch (err) {
        console.error('Error exporting data to Redis', err);
    }
};

exportXML(process.argv[2]);