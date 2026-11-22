'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// Stored order lines have price, qty, and HSN but no GST-rate snapshot. Keep
// gstRate explicitly null to exercise that current persisted-order behavior.
function item(id, name, price, qty, hsn) {
  return { id, name, sku: `SKU-${id}`, price, qty, hsn, gstRate: null };
}

const cases = [
  {
    name: 'CURRENT BEHAVIOUR: mixed 5% and 12% invoice matches checkout',
    order: {
      id: 1001,
      coupon: '',
      items: [
        item(1, 'Rice', 640, 1, '1006'),
        item(6, 'Ghee', 450, 1, '0405')
      ]
    },
    invoice: { subtotal: 1090, discount: 0, tax: 86, cgst: 43, sgst: 43, total: 1176, rates: [5, 12] },
    pricing: { subtotal: 1090, discount: 0, tax: 86, total: 1176, rates: [5, 12] }
  },
  {
    name: 'CURRENT BEHAVIOUR: SAVE10 discount is capped before tax',
    order: {
      id: 1002,
      coupon: 'SAVE10',
      items: [
        item(1, 'Rice', 640, 1, '1006'),
        item(4, 'Sunflower oil', 190, 2, '1512')
      ]
    },
    invoice: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9, rates: [5, 5] },
    pricing: { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9, rates: [5, 5] }
  },
  {
    name: 'CURRENT BEHAVIOUR: SAVE10 on ₹2,240 applies its ₹150 cap before tax',
    order: {
      id: 1004,
      coupon: 'SAVE10',
      items: [item(5, 'Groundnut oil', 1120, 2, '1508')]
    },
    invoice: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5, rates: [5] },
    pricing: { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5, rates: [5] }
  },
  {
    name: 'CURRENT BEHAVIOUR: all-18% order without a coupon',
    order: {
      id: 1008,
      coupon: '',
      items: [
        item(8, 'Packaged tea', 140, 1, '0902'),
        item(12, 'Kokum concentrate', 180, 2, '2106')
      ]
    },
    invoice: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590, rates: [18, 18] },
    pricing: { subtotal: 500, discount: 0, tax: 90, total: 590, rates: [18, 18] }
  }
];

describe('Invoice and checkout calculations', () => {
  for (const fixture of cases) {
    it(fixture.name, () => {
    const invoiceFigures = invoice.computeInvoiceFigures(fixture.order);
    const checkoutFigures = pricing.computeTotals(fixture.order.items, fixture.order.coupon);

    assert.deepEqual(
      {
        subtotal: invoiceFigures.subtotal,
        discount: invoiceFigures.discount,
        tax: invoiceFigures.tax,
        cgst: invoiceFigures.cgst,
        sgst: invoiceFigures.sgst,
        total: invoiceFigures.total,
        rates: invoiceFigures.rows.map(row => row.gstPercent)
      },
      fixture.invoice
    );
    assert.deepEqual(
      {
        subtotal: checkoutFigures.subtotal,
        discount: checkoutFigures.discount,
        tax: checkoutFigures.tax,
        total: checkoutFigures.total,
        rates: checkoutFigures.lines.map(line => line.gstPercent)
      },
      fixture.pricing
    );
    });
  }

  it('INVOICE MATCHES CHECKOUT: totals, discounts, and per-line HSN GST', () => {
    for (const fixture of cases) {
      const invoiceFigures = invoice.computeInvoiceFigures(fixture.order);
      const checkoutFigures = pricing.computeTotals(fixture.order.items, fixture.order.coupon);

      assert.deepEqual(
        {
          subtotal: invoiceFigures.subtotal,
          discount: invoiceFigures.discount,
          tax: invoiceFigures.tax,
          cgst: invoiceFigures.cgst,
          sgst: invoiceFigures.sgst,
          total: invoiceFigures.total
        },
        {
          subtotal: checkoutFigures.subtotal,
          discount: checkoutFigures.discount,
          tax: checkoutFigures.tax,
          cgst: checkoutFigures.cgst,
          sgst: checkoutFigures.sgst,
          total: checkoutFigures.total
        },
        `order #${fixture.order.id}`
      );
      assert.deepEqual(
        invoiceFigures.rows.map(row => ({ gstPercent: row.gstPercent, lineTax: row.lineTax })),
        checkoutFigures.lines.map(line => ({ gstPercent: line.gstPercent, lineTax: line.tax })),
        `per-line GST for order #${fixture.order.id}`
      );
    }
  });
});
