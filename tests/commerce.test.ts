import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  calculateCouponDiscount,
  calculateShippingCost,
  FREE_SHIPPING_THRESHOLD_PKR,
  MAX_ITEM_QUANTITY,
  MAX_ORDER_LINES,
  SHIPPING_COST_PKR,
} from '../lib/checkout-policy';

describe('production checkout policy', () => {
  it('applies the fixed Spark checkout shipping policy at its boundary', () => {
    assert.equal(calculateShippingCost(FREE_SHIPPING_THRESHOLD_PKR - 1), SHIPPING_COST_PKR);
    assert.equal(calculateShippingCost(FREE_SHIPPING_THRESHOLD_PKR), 0);
  });

  it('uses whole-PKR coupon totals and never discounts below zero', () => {
    assert.equal(calculateCouponDiscount(999, 'PERCENTAGE', 10), 99);
    assert.equal(calculateCouponDiscount(1000, 'FIXED', 250), 250);
    assert.equal(calculateCouponDiscount(1000, 'FIXED', 5000), 1000);
  });

  it('rejects unsafe coupon values', () => {
    assert.throws(() => calculateCouponDiscount(1000, 'PERCENTAGE', 101));
    assert.throws(() => calculateCouponDiscount(1000, 'FIXED', 0));
    assert.throws(() => calculateCouponDiscount(10.5, 'FIXED', 1));
  });

  it('keeps client constants aligned with the Firestore rules access design', () => {
    assert.equal(MAX_ORDER_LINES, 5);
    assert.equal(MAX_ITEM_QUANTITY, 20);
  });
});
