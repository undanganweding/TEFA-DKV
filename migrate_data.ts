// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';

import {
  initialProducts,
  initialOrders,
  initialCustomerFiles,
  initialTools,
  initialMaterials,
  initialStockMovements,
  initialTransactions,
  initialProcurements,
} from './src/data/mockData';

const URL = 'https://lkxzjggzeswuocirazhc.supabase.co';
const SERVICE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY';
const supabase = createClient(URL, SERVICE_KEY, { auth: { persistSession: false } });

// Mappings
const idMap = {
  products: {},
  materials: {},
  tools: {},
  orders: {},
  files: {},
  users: {}
};

// Generate deterministic UUIDs or just random UUIDs since we keep the mapping in memory
function getUuid() { return crypto.randomUUID(); }

// DRY RUN MODE
const DRY_RUN = process.argv.includes('--dry-run');
console.log(`\n=== MIGRATION SCRIPT STARTING [DRY_RUN=${DRY_RUN}] ===\n`);

async function migrate() {
  let stats = {
    products: { legacy: 0, imported: 0, skipped: 0, duplicate: 0, orphan: 0, mismatch: 0 },
    materials: { legacy: 0, imported: 0, skipped: 0, duplicate: 0, orphan: 0, mismatch: 0 },
    tools: { legacy: 0, imported: 0, skipped: 0, duplicate: 0, orphan: 0, mismatch: 0 },
    recipes: { legacy: 0, imported: 0, skipped: 0, duplicate: 0, orphan: 0, mismatch: 0 },
    orders: { legacy: 0, imported: 0, skipped: 0, duplicate: 0, orphan: 0, mismatch: 0 },
    orderItems: { legacy: 0, imported: 0, skipped: 0, duplicate: 0, orphan: 0, mismatch: 0 },
    payments: { legacy: 0, imported: 0, skipped: 0, duplicate: 0, orphan: 0, mismatch: 0 },
    refunds: { legacy: 0, imported: 0, skipped: 0, duplicate: 0, orphan: 0, mismatch: 0 },
    finance: { legacy: 0, imported: 0, skipped: 0, duplicate: 0, orphan: 0, mismatch: 0 },
    stock: { legacy: 0, imported: 0, skipped: 0, duplicate: 0, orphan: 0, mismatch: 0 },
    procurements: { legacy: 0, imported: 0, skipped: 0, duplicate: 0, orphan: 0, mismatch: 0 },
  };

  const toInsert = {
    materials: [],
    products: [],
    product_recipes: [],
    inventory_assets: [],
    annual_procurements: [],
    orders: [],
    order_items: [],
    payments: [],
    refunds: [],
    finance_transactions: [],
    stock_movements: [],
    files: []
  };

  // 1. MATERIALS
  stats.materials.legacy = initialMaterials.length;
  for (const m of initialMaterials) {
    if (m.currentStock < 0) { console.error(`ABORT: Material ${m.code} negative stock.`); return; }
    idMap.materials[m.id] = getUuid();
    toInsert.materials.push({
      id: idMap.materials[m.id],
      code: m.code,
      name: m.name,
      category: m.category,
      unit: m.unit,
      unit_price: m.unitPrice,
      cost_price: m.costPrice,
      selling_ref_price: m.sellingRefPrice,
      current_stock: m.currentStock,
      min_stock: m.minStock,
      status: m.status
    });
    stats.materials.imported++;
  }

  // 2. PRODUCTS
  stats.products.legacy = initialProducts.length;
  for (const p of initialProducts) {
    idMap.products[p.id] = getUuid();
    toInsert.products.push({
      id: idMap.products[p.id],
      code: p.code,
      name: p.name,
      category: p.category,
      unit: p.unit,
      base_price: p.basePrice,
      cost_price: p.costPrice,
      min_qty: p.minQty,
      description: p.description,
      is_custom_dimension: p.isCustomDimension
    });
    stats.products.imported++;

    // RECIPES (BOM)
    if (p.recipe) {
      for (const r of p.recipe) {
        stats.recipes.legacy++;
        const mUuid = idMap.materials[r.materialId];
        if (!mUuid) { console.error(`ABORT: Orphan recipe for Product ${p.code}`); return; }
        toInsert.product_recipes.push({
          product_id: idMap.products[p.id],
          material_id: mUuid,
          qty_required: r.qtyRequired
        });
        stats.recipes.imported++;
      }
    }
  }

  // 3. TOOLS (INVENTORY)
  stats.tools.legacy = initialTools.length;
  for (const t of initialTools) {
    idMap.tools[t.id] = getUuid();
    toInsert.inventory_assets.push({
      id: idMap.tools[t.id],
      asset_code: t.code,
      name: t.name,
      category: t.category,
      location: t.location,
      condition: t.condition,
      status: t.status,
      serial_number: t.serialNumber,
      purchase_date: t.purchaseDate
    });
    stats.tools.imported++;
  }

  // 4. PROCUREMENTS
  stats.procurements.legacy = initialProcurements.length;
  for (const p of initialProcurements) {
    toInsert.annual_procurements.push({
      title: p.title,
      year: p.year,
      category: p.category || 'Peralatan',
      target_item: p.targetItem || 'Unspecified',
      budget: p.totalBudget,
      actual_cost: p.usedBudget,
      estimated_unit_price: p.estimatedUnitPrice || p.totalBudget,
      status: p.status,
      priority: 'Normal'
    });
    stats.procurements.imported++;
  }

  // 5. ORDERS & ITEMS
  // We need an Admin profile UUID to assign created_by.
  // First let's get any Admin profile from DB.
  let adminId = null;
  if (!DRY_RUN) {
    const { data: adminProf } = await supabase.from('profiles').select('id').eq('role', 'Admin').limit(1).single();
    if (!adminProf) { console.error(`ABORT: No Admin profile found.`); return; }
    adminId = adminProf.id;
  } else {
    adminId = getUuid();
  }

  stats.orders.legacy = initialOrders.length;
  for (const o of initialOrders) {
    idMap.orders[o.id] = getUuid();
    idMap.orders[o.orderNo] = idMap.orders[o.id]; // Map by orderNo too

    // Check financial mismatch
    let itemSubtotal = 0;
    o.items.forEach(i => itemSubtotal += i.totalPrice);
    const totalCalc = itemSubtotal - (o.discount || 0) + (o.taxAmount || 0);
    if (totalCalc !== o.totalAmount) {
      console.error(`ABORT: Financial mismatch in Order ${o.orderNo}. Expected ${totalCalc} got ${o.totalAmount}`);
      return;
    }

    toInsert.orders.push({
      id: idMap.orders[o.id],
      order_no: o.orderNo,
      customer_name: o.customerName,
      customer_phone: o.customerPhone,
      institution: o.institution,
      order_date: o.orderDate,
      due_date: o.dueDate,
      status: o.status,
      payment_status: o.paymentStatus,
      subtotal: o.subtotal,
      discount: o.discount || 0,
      tax_amount: o.taxAmount || 0,
      total_amount: o.totalAmount,
      paid_amount: o.paidAmount || 0,
      refunded_amount: 0,
      balance_due: o.balanceDue || 0,
      created_by: adminId
    });
    stats.orders.imported++;

    for (const i of o.items) {
      stats.orderItems.legacy++;
      const pUuid = idMap.products[i.productId];
      if (!pUuid) { console.error(`ABORT: Orphan order item in ${o.orderNo} for prod ${i.productId}`); return; }
      toInsert.order_items.push({
        order_id: idMap.orders[o.id],
        product_id: pUuid,
        product_name: i.productName,
        unit: i.unit,
        unit_price: i.unitPrice,
        cost_price: 0,
        qty: i.qty,
        length_meters: i.lengthMeters,
        width_meters: i.widthMeters,
        calculated_area: i.calculatedArea,
        total_price: i.totalPrice
      });
      stats.orderItems.imported++;
    }
    
    // Create dummy payments based on paidAmount because legacy doesn't have explicit payments array
    if (o.paidAmount > 0) {
      stats.payments.legacy++;
      const pId = getUuid();
      toInsert.payments.push({
        id: pId,
        order_id: idMap.orders[o.id],
        amount: o.paidAmount,
        payment_method: o.paymentMethod || 'Cash'
      });
      stats.payments.imported++;
      
      // We will skip inserting these into finance_transactions since initialTransactions has them?
      // Wait! Let's check initialTransactions.
    }
  }

  // 6. FINANCE TRANSACTIONS
  stats.finance.legacy = initialTransactions.length;
  for (const t of initialTransactions) {
    let orderUuid = null;
    if (t.refOrderId && t.refOrderId !== '-') {
       orderUuid = idMap.orders[t.refOrderId]; // Can match ORD-xxx or POS-xxx
       if (!orderUuid) { console.error(`ABORT: Orphan Finance Tx ${t.transNo} refOrder ${t.refOrderId}`); return; }
    }
    toInsert.finance_transactions.push({
      trans_no: t.transNo,
      type: t.type,
      category: t.category,
      amount: t.amount,
      ref_order_no: t.refOrderId,
      description: t.description,
      operator: t.operator,
      status: t.status,
      payment_method: t.paymentMethod
    });
    stats.finance.imported++;
  }

  // 7. STOCK MOVEMENTS
  stats.stock.legacy = initialStockMovements.length;
  for (const s of initialStockMovements) {
    const mUuid = idMap.materials[s.materialId];
    if (!mUuid) { console.error(`ABORT: Orphan stock movement ${s.id} for material ${s.materialId}`); return; }
    const materialData = initialMaterials.find(x => x.id === s.materialId);
    toInsert.stock_movements.push({
      material_id: mUuid,
      material_name: materialData ? materialData.name : 'Unknown Material',
      type: s.type,
      quantity: s.quantity,
      before_stock: materialData ? materialData.currentStock - s.quantity : 0,
      after_stock: materialData ? materialData.currentStock : s.quantity,
      unit: s.unit,
      unit_cost: s.unitCost,
      total_value: s.totalValue,
      notes: s.notes,
      operator: s.operator
    });
    stats.stock.imported++;
  }
  
  if (DRY_RUN) {
    console.log("🟢 DRY RUN SUCCESS. Data is clean and ready to migrate.");
    console.log(stats);
    return;
  }

  // LIVE INSERT
  console.log("🟡 EXECUTING LIVE MIGRATION...");
  const insertOrder = [
    { table: 'materials', data: toInsert.materials },
    { table: 'products', data: toInsert.products },
    { table: 'inventory_assets', data: toInsert.inventory_assets },
    { table: 'annual_procurements', data: toInsert.annual_procurements },
    { table: 'product_recipes', data: toInsert.product_recipes },
    { table: 'orders', data: toInsert.orders },
    { table: 'order_items', data: toInsert.order_items },
    { table: 'payments', data: toInsert.payments },
    { table: 'finance_transactions', data: toInsert.finance_transactions },
    { table: 'stock_movements', data: toInsert.stock_movements }
  ];

  for (const step of insertOrder) {
    if (step.data.length === 0) continue;
    console.log(`Inserting ${step.data.length} records into ${step.table}...`);
    const { error } = await supabase.from(step.table).insert(step.data);
    if (error) {
      console.error(`🔴 ERROR inserting ${step.table}:`, error);
      console.error(`ABORTING MIGRATION!`);
      return;
    }
  }

  console.log("🟢 LIVE MIGRATION COMPLETE.");
}

migrate();
