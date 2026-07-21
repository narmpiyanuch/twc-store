# Product blueprint: Drinking Water POS & Factory Stock

## Product direction

The system combines a retail/wholesale POS, lot-aware inventory, light manufacturing, and OEM customer management. It should be installable as a PWA and optimized for touch use, while keeping the API separate for integrations and future mobile clients.

## Recommended stack

- Next.js App Router for the responsive web/PWA frontend.
- NestJS REST API with OpenAPI, validation, authentication, and role guards.
- PostgreSQL as the source of truth. Sales, payments, reservations, and stock movements require relational constraints and atomic transactions.
- Prisma or TypeORM as ORM; use migrations in production, never schema auto-sync.
- Redis is optional later for queues, rate limits, and cached dashboards—not the stock source of truth.
- Object storage for customer artwork, purchase documents, and QC certificates.

## MVP modules

1. Dashboard: daily sales, unpaid orders, low stock, production progress, and dispatch queue.
2. POS & sales orders: barcode scan, wholesale/retail price tiers, discount approval, split payment, tax invoice, delivery status, returns, and deposit/container tracking.
3. Inventory: multiple warehouses/locations, unit conversion (piece/pack/case/pallet), stock movement ledger, transfer, adjustment with reason and approval, cycle count, reorder point, reserved/available stock, lot and expiry.
4. Purchasing: suppliers, purchase orders, receiving by lot, QC hold/release, costs, and payable status.
5. Production: bill of materials/recipe, production order, issue materials, packaging, finished-goods lot, yield/waste, QC checkpoints, and label printing.
6. OEM/Private label: customer-specific SKU, artwork/version approval, minimum order quantity, price agreement, production specification, lead time, customer PO, and which finished lot was shipped to whom.
7. CRM & delivery: customer credit limit, addresses/routes, driver/vehicle, proof of delivery, outstanding balance, and reorder history.
8. Reports & governance: margin, stock valuation, movement, expiry, production yield, OEM profitability, cash shift, audit log, roles and permissions.

## Core workflows

### Sale

Draft order → reserve available stock → payment/credit approval → pick by FEFO → dispatch → post immutable stock movements → invoice/receipt.

### Production

Production order → reserve raw materials and packaging → issue lots → produce → record yield/waste → QC hold → release finished lot → available stock.

### Traceability

Supplier receipt lot → material issue → production order → finished-goods lot → sales-order line → customer/delivery. A recall search must work both backward and forward.

## Core entities

- Organization, Branch, Warehouse, Location, User, Role, Permission
- Customer, CustomerAddress, Supplier, DeliveryRoute
- Product, ProductVariant, Unit, UnitConversion, Barcode, PriceList
- Lot, InventoryBalance, StockMovement, StockReservation, StockCount
- SalesOrder, SalesOrderLine, Payment, Invoice, Return, Delivery
- PurchaseOrder, GoodsReceipt, SupplierLot
- Recipe/BOM, ProductionOrder, MaterialIssue, ProductionOutput, QCInspection, Waste
- OEMSpecification, ArtworkVersion, CustomerProduct, ContractPrice
- AuditLog

## Non-negotiable implementation rules

- Store stock as an append-only movement ledger; balances are derived/projected and reconciled.
- Every stock-changing action and payment runs inside a database transaction and carries an idempotency key.
- Never delete posted documents; reverse them with a linked correcting document.
- Track `on_hand`, `reserved`, `available`, and `in_qc` separately.
- Use decimal/numeric types, not floating-point, for money and unit quantities.
- Every lot records product, lot code, manufactured date, expiry/best-before, QC status, and source production/receipt.
- Role permissions and audit trails cover discounts, adjustments, voids, credit overrides, and lot release.

## Design principles

- Desktop: persistent left navigation, compact data tables, filters, and keyboard shortcuts.
- Mobile: bottom navigation for the five primary tasks, 44–48 px touch targets, sticky primary action, scan-first forms, and cards replacing wide tables where needed.
- Use calm water-inspired teal/blue, neutral surfaces, amber for attention, red only for destructive/error states, and never rely on color alone.
- Thai body text uses generous line height. Status labels use short words and consistent placement.

## Delivery phases

- Phase 1: authentication, products/units, customer, POS/order, payments, stock ledger, dashboard.
- Phase 2: purchasing, warehouse transfer/count, production/BOM, lot/QC, OEM specifications.
- Phase 3: delivery routes, accounting/export integrations, forecasting, notifications, offline queue, advanced analytics.

## Research basis

- Next.js official PWA guidance: App Router supports a web manifest and an installable app experience.
- NestJS official database guidance: the API is database agnostic and integrates with SQL ORMs; production schema synchronization should not be used.
- PostgreSQL constraints and transactions fit relational inventory invariants.
- GS1 Global Traceability Standard recommends product identification plus batch/lot information and dates for batch-level traceability and recalls.
