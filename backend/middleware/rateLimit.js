// Kufizim i thjeshtë në memorie: max kërkesa për IP brenda një dritareje kohe
export const rateLimit = ({ windowMs, max, message }) => {
    const hits = new Map();
    return (req, res, next) => {
        const now = Date.now();
        const key = req.ip;
        const entry = hits.get(key);
        if (!entry || entry.resetAt <= now) {
            hits.set(key, { count: 1, resetAt: now + windowMs });
        } else if (entry.count >= max) {
            return res.status(429).json({ success: false, message });
        } else {
            entry.count += 1;
        }
        if (hits.size > 5000) {
            for (const [ip, value] of hits) if (value.resetAt <= now) hits.delete(ip);
        }
        next();
    };
};
