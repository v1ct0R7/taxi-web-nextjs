// Pranon numra shqiptarë: 06XXXXXXXX, +3556XXXXXXXX, 003556XXXXXXXX dhe numra ndërkombëtarë
export function normalizePhone(input) {
    if (typeof input !== "string") return null;
    let phone = input.replace(/[\s\-().]/g, "");
    if (phone.startsWith("00")) phone = `+${phone.slice(2)}`;
    if (/^06\d{8}$/.test(phone)) phone = `+355${phone.slice(1)}`;
    if (/^6\d{8}$/.test(phone)) phone = `+355${phone}`;
    return /^\+\d{8,15}$/.test(phone) ? phone : null;
}
