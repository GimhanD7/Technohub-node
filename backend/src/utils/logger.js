const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const logActivity = async (userId, action, details = "", req = null) => {
  let ipAddress = 'UNKNOWN';
  let deviceInfo = 'Unknown Device';

  if (req) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(',')[0]?.trim();

    ipAddress = String(
      req.headers['cf-connecting-ip'] ||
      forwardedIp ||
      req.socket?.remoteAddress ||
      'UNKNOWN'
    ).substring(0, 45);
    const userAgent = (req.headers['user-agent'] || 'Unknown Device').toLowerCase();

    // Basic OS Parsing
    let os = "Unknown OS";
    if (userAgent.includes('windows') || userAgent.includes('win32')) os = "Windows";
    else if (userAgent.includes('macintosh') || userAgent.includes('mac os x')) os = "Mac";
    else if (userAgent.includes('linux')) os = "Linux";
    else if (userAgent.includes('android')) os = "Android";
    else if (userAgent.includes('iphone') || userAgent.includes('ipad')) os = "iOS";

    // Basic Browser Parsing
    let browser = "Unknown Browser";
    if (userAgent.includes('edge') || userAgent.includes('edg')) browser = "Edge";
    else if (userAgent.includes('chrome') && !userAgent.includes('edg')) browser = "Chrome";
    else if (userAgent.includes('safari') && !userAgent.includes('chrome')) browser = "Safari";
    else if (userAgent.includes('firefox')) browser = "Firefox";
    else if (userAgent.includes('opera') || userAgent.includes('opr')) browser = "Opera";

    if (os !== "Unknown OS" || browser !== "Unknown Browser") {
      deviceInfo = `${os} / ${browser}`;
    } else {
      deviceInfo = req.headers['user-agent']?.substring(0, 50) || "Unknown Device";
    }
  }

  try {
    await prisma.system_logs.create({
      data: {
        user_id: userId ? parseInt(userId) : null,
        action,
        details,
        ip_address: ipAddress,
        device_info: deviceInfo
      }
    });
    return true;
  } catch (error) {
    console.error("Failed to log activity:", error.message);
    return false;
  }
};

module.exports = { logActivity };
