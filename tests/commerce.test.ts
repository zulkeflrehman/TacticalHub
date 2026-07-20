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
import {
  assertOrderStatusTransition,
  assertPaymentStatusTransition,
  isPakistaniMobile,
  normalizePakistaniMobile,
} from '../lib/order-policy';
import { safeAccountRedirect } from '../lib/email-verification';

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

  it('normalizes only valid Pakistani mobile numbers', () => {
    assert.equal(normalizePakistaniMobile('0300 1234567'), '+923001234567');
    assert.equal(normalizePakistaniMobile('+923001234567'), '+923001234567');
    assert.equal(isPakistaniMobile('03001234567'), true);
    assert.equal(isPakistaniMobile('0312345678'), false);
    assert.throws(() => normalizePakistaniMobile('+15551234567'));
  });

  it('allows only safe forward order and payment transitions', () => {
    assert.doesNotThrow(() => assertOrderStatusTransition('PENDING', 'CONFIRMED'));
    assert.doesNotThrow(() => assertOrderStatusTransition('SHIPPED', 'DELIVERED'));
    assert.throws(() => assertOrderStatusTransition('PROCESSING', 'PENDING'));
    assert.doesNotThrow(() => assertPaymentStatusTransition('PENDING', 'PAID'));
    assert.throws(() => assertPaymentStatusTransition('PENDING', 'CANCELLED'));
    assert.throws(() => assertPaymentStatusTransition('PAID', 'REFUNDED'));
  });

  it('keeps account redirects on safe application paths', () => {
    assert.equal(safeAccountRedirect('/checkout?step=delivery'), '/checkout?step=delivery');
    assert.equal(safeAccountRedirect('https://evil.example'), '/account/profile');
    assert.equal(safeAccountRedirect('//evil.example'), '/account/profile');
    assert.equal(safeAccountRedirect('/\\evil.example'), '/account/profile');
    assert.equal(safeAccountRedirect('/%255cevil.example'), '/account/profile');
  });
});
