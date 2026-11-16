import test from "node:test";
import assert from "node:assert/strict";
import { calculateCityFare, haversineKm, isInsideTirana, parsePoint } from "../utils/pricing.js";
import { normalizePhone } from "../utils/phone.js";

const settings = { baseFare: 2.5, perKm: 0.9, minimumFare: 4 };

test("calculates distance between Skanderbeg Square and Blloku", () => {
    const km = haversineKm({ lat: 41.3275, lng: 19.8187 }, { lat: 41.3189, lng: 19.8155 });
    assert.ok(km > 0.9 && km < 1.1, `unexpected distance ${km}`);
});

test("applies minimum fare for very short city rides", () => {
    const { price } = calculateCityFare({ lat: 41.3275, lng: 19.8187 }, { lat: 41.3276, lng: 19.8188 }, settings);
    assert.equal(price, 4);
});

test("charges base fare plus road distance for longer rides", () => {
    const { price, distanceKm } = calculateCityFare({ lat: 41.3275, lng: 19.8187 }, { lat: 41.36, lng: 19.78 }, settings);
    assert.equal(price, Math.round((2.5 + distanceKm * 0.9) * 100) / 100);
    assert.ok(price > 4);
});

test("accepts points in Tirana and rejects Durrës", () => {
    assert.equal(isInsideTirana({ lat: 41.33, lng: 19.82 }), true);
    assert.equal(isInsideTirana({ lat: 41.3231, lng: 19.4414 }), false);
});

test("rejects missing or invalid coordinates", () => {
    assert.equal(parsePoint("", ""), null);
    assert.equal(parsePoint("abc", 19.8), null);
    assert.equal(parsePoint(120, 19.8), null);
    assert.deepEqual(parsePoint("41.3", "19.8"), { lat: 41.3, lng: 19.8 });
});

test("normalizes Albanian phone numbers", () => {
    assert.equal(normalizePhone("069 123 4567"), "+355691234567");
    assert.equal(normalizePhone("+355 69 123 4567"), "+355691234567");
    assert.equal(normalizePhone("00355691234567"), "+355691234567");
    assert.equal(normalizePhone("12"), null);
    assert.equal(normalizePhone(undefined), null);
});
