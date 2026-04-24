const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');
const Logger = require('./logger');

/**
 * @desc Extract client IP address from request
 */
const getClientIP = (req) => {
    return (
        req.ip ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket?.remoteAddress ||
        '127.0.0.1'
    );
};

/**
 * @desc Extract location from IP address
 */
const getLocationFromIP = (ip) => {
    try {
        const geo = geoip.lookup(ip);
        return geo ? { country: geo.country, city: geo.city, timezone: geo.timezone } : null;
    }
    catch (err) {
        Logger.error(`Error getting geolocation: ${err.message}`);
        return null;
    }
};

/**
 * @desc Extract device info from user agent
 */
const getDeviceInfo = (userAgent) => {
    try {
        const parser = new UAParser(userAgent);
        const result = parser.getResult();
        return {
            browser: result.browser.name || 'Unknown',
            os: result.os.name || 'Unknown',
            device: result.device.type || 'desktop'
        };
    }
    catch (err) {
        Logger.error(`Error parsing user agent: ${err.message}`);
        return { browser: 'Unknown', os: 'Unknown', device: 'unknown' };
    }
};

/**
 * @desc Extract metadata from request
 */
exports.extractRequestMetaData = (req) => {
    const ip = getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const location = getLocationFromIP(ip);
    const deviceInfo = getDeviceInfo(userAgent);
    
    return {
        ip,
        userAgent,
        location,
        deviceInfo,
        timestamp: new Date(),
        method: req.method,
        path: req.path,
        referer: req.headers.referer || 'Unknown'
    };
};
