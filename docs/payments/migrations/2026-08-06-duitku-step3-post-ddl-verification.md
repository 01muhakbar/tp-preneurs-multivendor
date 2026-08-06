# PAY-DUITKU-STEP2: Read-Only DDL Preflight

Date: 2026-08-06
Environment: local development
Started at: 2026-08-06T11:59:02.532Z
Finished at: 2026-08-06T11:59:03.187Z
Scope: Step 2 read-only schema inspection only.
Decision: Read-only preflight completed; review required before migration approval.

## Redacted Database Target

```json
{
  "mode": "DB_*",
  "dialect": "mysql",
  "host": "localhost",
  "port": 3306,
  "database": "ecommerce_dev",
  "username": "<redacted>",
  "password": "",
  "ssl": false,
  "sslRejectUnauthorized": true
}
```
## Physical Table Resolution

```json
{
  "resolvedTables": {
    "users": "users",
    "orders": "orders",
    "suborders": "suborders",
    "payments": "payments",
    "payment_proofs": "payment_proofs",
    "payment_status_logs": "payment_status_logs",
    "stores": "stores",
    "store_payment_profiles": "store_payment_profiles"
  },
  "resolutionIssues": []
}
```
## MySQL Version And Active Schema
Status: ok


```json
[
  {
    "mysql_version": "10.4.32-MariaDB",
    "current_schema": "ecommerce_dev"
  }
]
```
## Base Table Engines
Status: ok


```json
[
  {
    "table_name": "orders",
    "engine": "InnoDB"
  },
  {
    "table_name": "payments",
    "engine": "InnoDB"
  },
  {
    "table_name": "payment_proofs",
    "engine": "InnoDB"
  },
  {
    "table_name": "payment_status_logs",
    "engine": "InnoDB"
  },
  {
    "table_name": "stores",
    "engine": "InnoDB"
  },
  {
    "table_name": "store_payment_profiles",
    "engine": "InnoDB"
  },
  {
    "table_name": "suborders",
    "engine": "InnoDB"
  },
  {
    "table_name": "users",
    "engine": "InnoDB"
  }
]
```
## Base Table Case Variants
Status: ok


```json
[
  {
    "logical_name": "orders",
    "variant_count": 1,
    "variants": "orders"
  },
  {
    "logical_name": "payments",
    "variant_count": 1,
    "variants": "payments"
  },
  {
    "logical_name": "payment_proofs",
    "variant_count": 1,
    "variants": "payment_proofs"
  },
  {
    "logical_name": "payment_status_logs",
    "variant_count": 1,
    "variants": "payment_status_logs"
  },
  {
    "logical_name": "stores",
    "variant_count": 1,
    "variants": "stores"
  },
  {
    "logical_name": "store_payment_profiles",
    "variant_count": 1,
    "variants": "store_payment_profiles"
  },
  {
    "logical_name": "suborders",
    "variant_count": 1,
    "variants": "suborders"
  },
  {
    "logical_name": "users",
    "variant_count": 1,
    "variants": "users"
  }
]
```
## Base Columns
Status: ok


```json
[
  {
    "table_name": "orders",
    "column_name": "id",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "PRI",
    "extra": "auto_increment"
  },
  {
    "table_name": "orders",
    "column_name": "invoice_no",
    "column_type": "varchar(255)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "UNI",
    "extra": ""
  },
  {
    "table_name": "orders",
    "column_name": "user_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "orders",
    "column_name": "checkout_mode",
    "column_type": "enum('LEGACY','SINGLE_STORE','MULTI_STORE')",
    "is_nullable": "YES",
    "column_default": "'LEGACY'",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "orders",
    "column_name": "subtotal_amount",
    "column_type": "decimal(12,2)",
    "is_nullable": "YES",
    "column_default": "0.00",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "orders",
    "column_name": "shipping_amount",
    "column_type": "decimal(12,2)",
    "is_nullable": "YES",
    "column_default": "0.00",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "orders",
    "column_name": "service_fee_amount",
    "column_type": "decimal(12,2)",
    "is_nullable": "YES",
    "column_default": "0.00",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "orders",
    "column_name": "payment_status",
    "column_type": "enum('UNPAID','PARTIALLY_PAID','PAID')",
    "is_nullable": "YES",
    "column_default": "'UNPAID'",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "orders",
    "column_name": "shipping_details",
    "column_type": "longtext",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "orders",
    "column_name": "customer_name",
    "column_type": "varchar(120)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "orders",
    "column_name": "customer_phone",
    "column_type": "varchar(30)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "orders",
    "column_name": "customer_address",
    "column_type": "text",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "orders",
    "column_name": "customer_notes",
    "column_type": "text",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "orders",
    "column_name": "payment_method",
    "column_type": "varchar(30)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "orders",
    "column_name": "coupon_code",
    "column_type": "varchar(50)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "orders",
    "column_name": "discount_amount",
    "column_type": "decimal(10,2)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "orders",
    "column_name": "total_amount",
    "column_type": "decimal(10,2)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "orders",
    "column_name": "status",
    "column_type": "enum('pending','paid','processing','shipped','delivered','completed','cancelled')",
    "is_nullable": "NO",
    "column_default": "'pending'",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "orders",
    "column_name": "created_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "orders",
    "column_name": "updated_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "payments",
    "column_name": "id",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "PRI",
    "extra": "auto_increment"
  },
  {
    "table_name": "payments",
    "column_name": "suborder_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "payments",
    "column_name": "store_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "payments",
    "column_name": "store_payment_profile_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "payments",
    "column_name": "payment_channel",
    "column_type": "enum('QRIS','DUITKU')",
    "is_nullable": "NO",
    "column_default": "'QRIS'",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "payments",
    "column_name": "payment_type",
    "column_type": "enum('QRIS_STATIC','DUITKU_POP')",
    "is_nullable": "NO",
    "column_default": "'QRIS_STATIC'",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "payments",
    "column_name": "external_reference",
    "column_type": "varchar(160)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "payments",
    "column_name": "internal_reference",
    "column_type": "varchar(160)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "UNI",
    "extra": ""
  },
  {
    "table_name": "payments",
    "column_name": "amount",
    "column_type": "decimal(12,2)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "payments",
    "column_name": "qr_image_url",
    "column_type": "longtext",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "payments",
    "column_name": "qr_payload",
    "column_type": "longtext",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "payments",
    "column_name": "status",
    "column_type": "enum('CREATED','PENDING_CONFIRMATION','PAID','FAILED','CANCELLED','EXPIRED','REJECTED')",
    "is_nullable": "NO",
    "column_default": "'CREATED'",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "payments",
    "column_name": "expires_at",
    "column_type": "datetime",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "payments",
    "column_name": "paid_at",
    "column_type": "datetime",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "payments",
    "column_name": "created_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "payments",
    "column_name": "updated_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "payments",
    "column_name": "allocation_key",
    "column_type": "varchar(160)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "UNI",
    "extra": ""
  },
  {
    "table_name": "payments",
    "column_name": "paid_by_order_payment_attempt_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "payment_proofs",
    "column_name": "id",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "PRI",
    "extra": "auto_increment"
  },
  {
    "table_name": "payment_proofs",
    "column_name": "payment_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "payment_proofs",
    "column_name": "uploaded_by_user_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "payment_proofs",
    "column_name": "proof_image_url",
    "column_type": "longtext",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "payment_proofs",
    "column_name": "sender_name",
    "column_type": "varchar(160)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "payment_proofs",
    "column_name": "sender_bank_or_wallet",
    "column_type": "varchar(160)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "payment_proofs",
    "column_name": "transfer_amount",
    "column_type": "decimal(12,2)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "payment_proofs",
    "column_name": "transfer_time",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "payment_proofs",
    "column_name": "note",
    "column_type": "text",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "payment_proofs",
    "column_name": "review_note",
    "column_type": "text",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "payment_proofs",
    "column_name": "review_status",
    "column_type": "enum('PENDING','APPROVED','REJECTED')",
    "is_nullable": "NO",
    "column_default": "'PENDING'",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "payment_proofs",
    "column_name": "reviewed_by_user_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "payment_proofs",
    "column_name": "reviewed_at",
    "column_type": "datetime",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "payment_proofs",
    "column_name": "created_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "payment_proofs",
    "column_name": "updated_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "payment_status_logs",
    "column_name": "id",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "PRI",
    "extra": "auto_increment"
  },
  {
    "table_name": "payment_status_logs",
    "column_name": "payment_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "payment_status_logs",
    "column_name": "old_status",
    "column_type": "varchar(80)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "payment_status_logs",
    "column_name": "new_status",
    "column_type": "varchar(80)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "payment_status_logs",
    "column_name": "actor_type",
    "column_type": "enum('SYSTEM','BUYER','SELLER','ADMIN','WEBHOOK')",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "payment_status_logs",
    "column_name": "actor_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "payment_status_logs",
    "column_name": "note",
    "column_type": "text",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "payment_status_logs",
    "column_name": "created_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "payment_status_logs",
    "column_name": "updated_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "stores",
    "column_name": "id",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "PRI",
    "extra": "auto_increment"
  },
  {
    "table_name": "stores",
    "column_name": "owner_user_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "UNI",
    "extra": ""
  },
  {
    "table_name": "stores",
    "column_name": "active_store_payment_profile_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "stores",
    "column_name": "name",
    "column_type": "varchar(160)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "stores",
    "column_name": "slug",
    "column_type": "varchar(180)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "UNI",
    "extra": ""
  },
  {
    "table_name": "stores",
    "column_name": "status",
    "column_type": "enum('ACTIVE','INACTIVE')",
    "is_nullable": "NO",
    "column_default": "'ACTIVE'",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "stores",
    "column_name": "description",
    "column_type": "text",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "stores",
    "column_name": "logo_url",
    "column_type": "varchar(2048)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "stores",
    "column_name": "banner_url",
    "column_type": "varchar(2048)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "stores",
    "column_name": "email",
    "column_type": "varchar(160)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "stores",
    "column_name": "phone",
    "column_type": "varchar(64)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "stores",
    "column_name": "whatsapp",
    "column_type": "varchar(64)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "stores",
    "column_name": "website_url",
    "column_type": "varchar(2048)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "stores",
    "column_name": "instagram_url",
    "column_type": "varchar(2048)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "stores",
    "column_name": "tiktok_url",
    "column_type": "varchar(2048)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "stores",
    "column_name": "address_line_1",
    "column_type": "varchar(255)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "stores",
    "column_name": "address_line_2",
    "column_type": "varchar(255)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "stores",
    "column_name": "city",
    "column_type": "varchar(120)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "stores",
    "column_name": "district",
    "column_type": "varchar(120)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "stores",
    "column_name": "province",
    "column_type": "varchar(120)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "stores",
    "column_name": "postal_code",
    "column_type": "varchar(32)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "stores",
    "column_name": "country",
    "column_type": "varchar(120)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "stores",
    "column_name": "shipping_setup",
    "column_type": "longtext",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "stores",
    "column_name": "created_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "stores",
    "column_name": "updated_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "stores",
    "column_name": "owner_identity",
    "column_type": "longtext",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "stores",
    "column_name": "business_details",
    "column_type": "longtext",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "id",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "PRI",
    "extra": "auto_increment"
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "store_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "provider_code",
    "column_type": "enum('MANUAL_QRIS')",
    "is_nullable": "NO",
    "column_default": "'MANUAL_QRIS'",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "payment_type",
    "column_type": "enum('QRIS_STATIC')",
    "is_nullable": "NO",
    "column_default": "'QRIS_STATIC'",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "version",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": "1",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "snapshot_status",
    "column_type": "enum('ACTIVE','SUPERSEDED','INACTIVE')",
    "is_nullable": "NO",
    "column_default": "'INACTIVE'",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "account_name",
    "column_type": "varchar(160)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "merchant_name",
    "column_type": "varchar(160)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "merchant_id",
    "column_type": "varchar(160)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "qris_image_url",
    "column_type": "longtext",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "qris_payload",
    "column_type": "longtext",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "instruction_text",
    "column_type": "text",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "is_active",
    "column_type": "tinyint(1)",
    "is_nullable": "NO",
    "column_default": "0",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "verification_status",
    "column_type": "enum('PENDING','ACTIVE','REJECTED','INACTIVE')",
    "is_nullable": "NO",
    "column_default": "'PENDING'",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "source_request_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "verified_by_admin_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "verified_at",
    "column_type": "datetime",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "activated_by_admin_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "activated_at",
    "column_type": "datetime",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "superseded_by_profile_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "superseded_at",
    "column_type": "datetime",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "created_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "updated_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "suborders",
    "column_name": "id",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "PRI",
    "extra": "auto_increment"
  },
  {
    "table_name": "suborders",
    "column_name": "order_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "suborders",
    "column_name": "suborder_number",
    "column_type": "varchar(120)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "UNI",
    "extra": ""
  },
  {
    "table_name": "suborders",
    "column_name": "store_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "suborders",
    "column_name": "store_payment_profile_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "suborders",
    "column_name": "applied_coupon_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "suborders",
    "column_name": "applied_coupon_code",
    "column_type": "varchar(120)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "suborders",
    "column_name": "applied_coupon_scope_type",
    "column_type": "enum('PLATFORM','STORE')",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "suborders",
    "column_name": "subtotal_amount",
    "column_type": "decimal(12,2)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "suborders",
    "column_name": "shipping_amount",
    "column_type": "decimal(12,2)",
    "is_nullable": "NO",
    "column_default": "0.00",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "suborders",
    "column_name": "service_fee_amount",
    "column_type": "decimal(12,2)",
    "is_nullable": "NO",
    "column_default": "0.00",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "suborders",
    "column_name": "total_amount",
    "column_type": "decimal(12,2)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "suborders",
    "column_name": "payment_method",
    "column_type": "enum('QRIS','DUITKU')",
    "is_nullable": "NO",
    "column_default": "'QRIS'",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "suborders",
    "column_name": "payment_status",
    "column_type": "enum('UNPAID','PENDING_CONFIRMATION','PAID','FAILED','EXPIRED','CANCELLED')",
    "is_nullable": "NO",
    "column_default": "'UNPAID'",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "suborders",
    "column_name": "fulfillment_status",
    "column_type": "enum('UNFULFILLED','PROCESSING','SHIPPED','DELIVERED','CANCELLED')",
    "is_nullable": "NO",
    "column_default": "'UNFULFILLED'",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "suborders",
    "column_name": "expires_at",
    "column_type": "datetime",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "suborders",
    "column_name": "paid_at",
    "column_type": "datetime",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "suborders",
    "column_name": "internal_notes",
    "column_type": "text",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "suborders",
    "column_name": "created_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "suborders",
    "column_name": "updated_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "users",
    "column_name": "id",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "PRI",
    "extra": "auto_increment"
  },
  {
    "table_name": "users",
    "column_name": "name",
    "column_type": "varchar(120)",
    "is_nullable": "NO",
    "column_default": "''",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "users",
    "column_name": "email",
    "column_type": "varchar(160)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "UNI",
    "extra": ""
  },
  {
    "table_name": "users",
    "column_name": "phone_number",
    "column_type": "varchar(40)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "UNI",
    "extra": ""
  },
  {
    "table_name": "users",
    "column_name": "avatar_url",
    "column_type": "varchar(255)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "users",
    "column_name": "password",
    "column_type": "varchar(255)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "users",
    "column_name": "role",
    "column_type": "varchar(50)",
    "is_nullable": "NO",
    "column_default": "'user'",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "users",
    "column_name": "seller_role_code",
    "column_type": "varchar(64)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "users",
    "column_name": "permission_keys",
    "column_type": "longtext",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "users",
    "column_name": "status",
    "column_type": "varchar(32)",
    "is_nullable": "NO",
    "column_default": "'active'",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "users",
    "column_name": "is_published",
    "column_type": "tinyint(1)",
    "is_nullable": "NO",
    "column_default": "1",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "users",
    "column_name": "created_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "users",
    "column_name": "updated_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  }
]
```
## Base Indexes
Status: ok


```json
[
  {
    "table_name": "orders",
    "index_name": "invoice_no",
    "non_unique": 0,
    "columns_in_order": "invoice_no"
  },
  {
    "table_name": "orders",
    "index_name": "invoice_no_10",
    "non_unique": 0,
    "columns_in_order": "invoice_no"
  },
  {
    "table_name": "orders",
    "index_name": "invoice_no_11",
    "non_unique": 0,
    "columns_in_order": "invoice_no"
  },
  {
    "table_name": "orders",
    "index_name": "invoice_no_12",
    "non_unique": 0,
    "columns_in_order": "invoice_no"
  },
  {
    "table_name": "orders",
    "index_name": "invoice_no_13",
    "non_unique": 0,
    "columns_in_order": "invoice_no"
  },
  {
    "table_name": "orders",
    "index_name": "invoice_no_2",
    "non_unique": 0,
    "columns_in_order": "invoice_no"
  },
  {
    "table_name": "orders",
    "index_name": "invoice_no_3",
    "non_unique": 0,
    "columns_in_order": "invoice_no"
  },
  {
    "table_name": "orders",
    "index_name": "invoice_no_4",
    "non_unique": 0,
    "columns_in_order": "invoice_no"
  },
  {
    "table_name": "orders",
    "index_name": "invoice_no_5",
    "non_unique": 0,
    "columns_in_order": "invoice_no"
  },
  {
    "table_name": "orders",
    "index_name": "invoice_no_6",
    "non_unique": 0,
    "columns_in_order": "invoice_no"
  },
  {
    "table_name": "orders",
    "index_name": "invoice_no_7",
    "non_unique": 0,
    "columns_in_order": "invoice_no"
  },
  {
    "table_name": "orders",
    "index_name": "invoice_no_8",
    "non_unique": 0,
    "columns_in_order": "invoice_no"
  },
  {
    "table_name": "orders",
    "index_name": "invoice_no_9",
    "non_unique": 0,
    "columns_in_order": "invoice_no"
  },
  {
    "table_name": "orders",
    "index_name": "PRIMARY",
    "non_unique": 0,
    "columns_in_order": "id"
  },
  {
    "table_name": "orders",
    "index_name": "user_id",
    "non_unique": 1,
    "columns_in_order": "user_id"
  },
  {
    "table_name": "payments",
    "index_name": "idx_payments_paid_by_attempt",
    "non_unique": 1,
    "columns_in_order": "paid_by_order_payment_attempt_id"
  },
  {
    "table_name": "payments",
    "index_name": "internal_reference",
    "non_unique": 0,
    "columns_in_order": "internal_reference"
  },
  {
    "table_name": "payments",
    "index_name": "internal_reference_10",
    "non_unique": 0,
    "columns_in_order": "internal_reference"
  },
  {
    "table_name": "payments",
    "index_name": "internal_reference_11",
    "non_unique": 0,
    "columns_in_order": "internal_reference"
  },
  {
    "table_name": "payments",
    "index_name": "internal_reference_12",
    "non_unique": 0,
    "columns_in_order": "internal_reference"
  },
  {
    "table_name": "payments",
    "index_name": "internal_reference_13",
    "non_unique": 0,
    "columns_in_order": "internal_reference"
  },
  {
    "table_name": "payments",
    "index_name": "internal_reference_2",
    "non_unique": 0,
    "columns_in_order": "internal_reference"
  },
  {
    "table_name": "payments",
    "index_name": "internal_reference_3",
    "non_unique": 0,
    "columns_in_order": "internal_reference"
  },
  {
    "table_name": "payments",
    "index_name": "internal_reference_4",
    "non_unique": 0,
    "columns_in_order": "internal_reference"
  },
  {
    "table_name": "payments",
    "index_name": "internal_reference_5",
    "non_unique": 0,
    "columns_in_order": "internal_reference"
  },
  {
    "table_name": "payments",
    "index_name": "internal_reference_6",
    "non_unique": 0,
    "columns_in_order": "internal_reference"
  },
  {
    "table_name": "payments",
    "index_name": "internal_reference_7",
    "non_unique": 0,
    "columns_in_order": "internal_reference"
  },
  {
    "table_name": "payments",
    "index_name": "internal_reference_8",
    "non_unique": 0,
    "columns_in_order": "internal_reference"
  },
  {
    "table_name": "payments",
    "index_name": "internal_reference_9",
    "non_unique": 0,
    "columns_in_order": "internal_reference"
  },
  {
    "table_name": "payments",
    "index_name": "PRIMARY",
    "non_unique": 0,
    "columns_in_order": "id"
  },
  {
    "table_name": "payments",
    "index_name": "store_id",
    "non_unique": 1,
    "columns_in_order": "store_id"
  },
  {
    "table_name": "payments",
    "index_name": "store_payment_profile_id",
    "non_unique": 1,
    "columns_in_order": "store_payment_profile_id"
  },
  {
    "table_name": "payments",
    "index_name": "suborder_id",
    "non_unique": 1,
    "columns_in_order": "suborder_id"
  },
  {
    "table_name": "payments",
    "index_name": "uniq_payments_allocation_key",
    "non_unique": 0,
    "columns_in_order": "allocation_key"
  },
  {
    "table_name": "payment_proofs",
    "index_name": "payment_id",
    "non_unique": 1,
    "columns_in_order": "payment_id"
  },
  {
    "table_name": "payment_proofs",
    "index_name": "PRIMARY",
    "non_unique": 0,
    "columns_in_order": "id"
  },
  {
    "table_name": "payment_proofs",
    "index_name": "reviewed_by_user_id",
    "non_unique": 1,
    "columns_in_order": "reviewed_by_user_id"
  },
  {
    "table_name": "payment_proofs",
    "index_name": "uploaded_by_user_id",
    "non_unique": 1,
    "columns_in_order": "uploaded_by_user_id"
  },
  {
    "table_name": "payment_status_logs",
    "index_name": "actor_id",
    "non_unique": 1,
    "columns_in_order": "actor_id"
  },
  {
    "table_name": "payment_status_logs",
    "index_name": "payment_id",
    "non_unique": 1,
    "columns_in_order": "payment_id"
  },
  {
    "table_name": "payment_status_logs",
    "index_name": "PRIMARY",
    "non_unique": 0,
    "columns_in_order": "id"
  },
  {
    "table_name": "stores",
    "index_name": "active_store_payment_profile_id",
    "non_unique": 1,
    "columns_in_order": "active_store_payment_profile_id"
  },
  {
    "table_name": "stores",
    "index_name": "owner_user_id",
    "non_unique": 0,
    "columns_in_order": "owner_user_id"
  },
  {
    "table_name": "stores",
    "index_name": "PRIMARY",
    "non_unique": 0,
    "columns_in_order": "id"
  },
  {
    "table_name": "stores",
    "index_name": "slug",
    "non_unique": 0,
    "columns_in_order": "slug"
  },
  {
    "table_name": "stores",
    "index_name": "slug_10",
    "non_unique": 0,
    "columns_in_order": "slug"
  },
  {
    "table_name": "stores",
    "index_name": "slug_11",
    "non_unique": 0,
    "columns_in_order": "slug"
  },
  {
    "table_name": "stores",
    "index_name": "slug_12",
    "non_unique": 0,
    "columns_in_order": "slug"
  },
  {
    "table_name": "stores",
    "index_name": "slug_13",
    "non_unique": 0,
    "columns_in_order": "slug"
  },
  {
    "table_name": "stores",
    "index_name": "slug_14",
    "non_unique": 0,
    "columns_in_order": "slug"
  },
  {
    "table_name": "stores",
    "index_name": "slug_2",
    "non_unique": 0,
    "columns_in_order": "slug"
  },
  {
    "table_name": "stores",
    "index_name": "slug_3",
    "non_unique": 0,
    "columns_in_order": "slug"
  },
  {
    "table_name": "stores",
    "index_name": "slug_4",
    "non_unique": 0,
    "columns_in_order": "slug"
  },
  {
    "table_name": "stores",
    "index_name": "slug_5",
    "non_unique": 0,
    "columns_in_order": "slug"
  },
  {
    "table_name": "stores",
    "index_name": "slug_6",
    "non_unique": 0,
    "columns_in_order": "slug"
  },
  {
    "table_name": "stores",
    "index_name": "slug_7",
    "non_unique": 0,
    "columns_in_order": "slug"
  },
  {
    "table_name": "stores",
    "index_name": "slug_8",
    "non_unique": 0,
    "columns_in_order": "slug"
  },
  {
    "table_name": "stores",
    "index_name": "slug_9",
    "non_unique": 0,
    "columns_in_order": "slug"
  },
  {
    "table_name": "store_payment_profiles",
    "index_name": "activated_by_admin_id",
    "non_unique": 1,
    "columns_in_order": "activated_by_admin_id"
  },
  {
    "table_name": "store_payment_profiles",
    "index_name": "PRIMARY",
    "non_unique": 0,
    "columns_in_order": "id"
  },
  {
    "table_name": "store_payment_profiles",
    "index_name": "source_request_id",
    "non_unique": 1,
    "columns_in_order": "source_request_id"
  },
  {
    "table_name": "store_payment_profiles",
    "index_name": "store_id",
    "non_unique": 1,
    "columns_in_order": "store_id"
  },
  {
    "table_name": "store_payment_profiles",
    "index_name": "superseded_by_profile_id",
    "non_unique": 1,
    "columns_in_order": "superseded_by_profile_id"
  },
  {
    "table_name": "store_payment_profiles",
    "index_name": "verified_by_admin_id",
    "non_unique": 1,
    "columns_in_order": "verified_by_admin_id"
  },
  {
    "table_name": "suborders",
    "index_name": "applied_coupon_id",
    "non_unique": 1,
    "columns_in_order": "applied_coupon_id"
  },
  {
    "table_name": "suborders",
    "index_name": "order_id",
    "non_unique": 1,
    "columns_in_order": "order_id"
  },
  {
    "table_name": "suborders",
    "index_name": "PRIMARY",
    "non_unique": 0,
    "columns_in_order": "id"
  },
  {
    "table_name": "suborders",
    "index_name": "store_id",
    "non_unique": 1,
    "columns_in_order": "store_id"
  },
  {
    "table_name": "suborders",
    "index_name": "store_payment_profile_id",
    "non_unique": 1,
    "columns_in_order": "store_payment_profile_id"
  },
  {
    "table_name": "suborders",
    "index_name": "suborder_number",
    "non_unique": 0,
    "columns_in_order": "suborder_number"
  },
  {
    "table_name": "suborders",
    "index_name": "suborder_number_10",
    "non_unique": 0,
    "columns_in_order": "suborder_number"
  },
  {
    "table_name": "suborders",
    "index_name": "suborder_number_11",
    "non_unique": 0,
    "columns_in_order": "suborder_number"
  },
  {
    "table_name": "suborders",
    "index_name": "suborder_number_12",
    "non_unique": 0,
    "columns_in_order": "suborder_number"
  },
  {
    "table_name": "suborders",
    "index_name": "suborder_number_13",
    "non_unique": 0,
    "columns_in_order": "suborder_number"
  },
  {
    "table_name": "suborders",
    "index_name": "suborder_number_2",
    "non_unique": 0,
    "columns_in_order": "suborder_number"
  },
  {
    "table_name": "suborders",
    "index_name": "suborder_number_3",
    "non_unique": 0,
    "columns_in_order": "suborder_number"
  },
  {
    "table_name": "suborders",
    "index_name": "suborder_number_4",
    "non_unique": 0,
    "columns_in_order": "suborder_number"
  },
  {
    "table_name": "suborders",
    "index_name": "suborder_number_5",
    "non_unique": 0,
    "columns_in_order": "suborder_number"
  },
  {
    "table_name": "suborders",
    "index_name": "suborder_number_6",
    "non_unique": 0,
    "columns_in_order": "suborder_number"
  },
  {
    "table_name": "suborders",
    "index_name": "suborder_number_7",
    "non_unique": 0,
    "columns_in_order": "suborder_number"
  },
  {
    "table_name": "suborders",
    "index_name": "suborder_number_8",
    "non_unique": 0,
    "columns_in_order": "suborder_number"
  },
  {
    "table_name": "suborders",
    "index_name": "suborder_number_9",
    "non_unique": 0,
    "columns_in_order": "suborder_number"
  },
  {
    "table_name": "users",
    "index_name": "PRIMARY",
    "non_unique": 0,
    "columns_in_order": "id"
  },
  {
    "table_name": "users",
    "index_name": "users_email",
    "non_unique": 0,
    "columns_in_order": "email"
  },
  {
    "table_name": "users",
    "index_name": "users_phone_number_unique",
    "non_unique": 0,
    "columns_in_order": "phone_number"
  }
]
```
## Base Foreign Keys
Status: ok


```json
[
  {
    "table_name": "orders",
    "column_name": "user_id",
    "constraint_name": "orders_ibfk_1",
    "referenced_table_name": "users",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "NO ACTION"
  },
  {
    "table_name": "orders",
    "column_name": "user_id",
    "constraint_name": "orders_ibfk_10",
    "referenced_table_name": "users",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "NO ACTION"
  },
  {
    "table_name": "orders",
    "column_name": "user_id",
    "constraint_name": "orders_ibfk_11",
    "referenced_table_name": "users",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "NO ACTION"
  },
  {
    "table_name": "orders",
    "column_name": "user_id",
    "constraint_name": "orders_ibfk_12",
    "referenced_table_name": "users",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "NO ACTION"
  },
  {
    "table_name": "orders",
    "column_name": "user_id",
    "constraint_name": "orders_ibfk_2",
    "referenced_table_name": "users",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "NO ACTION"
  },
  {
    "table_name": "orders",
    "column_name": "user_id",
    "constraint_name": "orders_ibfk_3",
    "referenced_table_name": "users",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "NO ACTION"
  },
  {
    "table_name": "orders",
    "column_name": "user_id",
    "constraint_name": "orders_ibfk_4",
    "referenced_table_name": "users",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "NO ACTION"
  },
  {
    "table_name": "orders",
    "column_name": "user_id",
    "constraint_name": "orders_ibfk_5",
    "referenced_table_name": "users",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "NO ACTION"
  },
  {
    "table_name": "orders",
    "column_name": "user_id",
    "constraint_name": "orders_ibfk_6",
    "referenced_table_name": "users",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "NO ACTION"
  },
  {
    "table_name": "orders",
    "column_name": "user_id",
    "constraint_name": "orders_ibfk_7",
    "referenced_table_name": "users",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "NO ACTION"
  },
  {
    "table_name": "orders",
    "column_name": "user_id",
    "constraint_name": "orders_ibfk_8",
    "referenced_table_name": "users",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "NO ACTION"
  },
  {
    "table_name": "orders",
    "column_name": "user_id",
    "constraint_name": "orders_ibfk_9",
    "referenced_table_name": "users",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "NO ACTION"
  },
  {
    "table_name": "payments",
    "column_name": "paid_by_order_payment_attempt_id",
    "constraint_name": "fk_payments_paid_by_attempt",
    "referenced_table_name": "order_payment_attempts",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "RESTRICT"
  },
  {
    "table_name": "payments",
    "column_name": "suborder_id",
    "constraint_name": "payments_ibfk_34",
    "referenced_table_name": "suborders",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "CASCADE"
  },
  {
    "table_name": "payments",
    "column_name": "store_id",
    "constraint_name": "payments_ibfk_35",
    "referenced_table_name": "stores",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "CASCADE"
  },
  {
    "table_name": "payments",
    "column_name": "store_payment_profile_id",
    "constraint_name": "payments_ibfk_36",
    "referenced_table_name": "store_payment_profiles",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "SET NULL"
  },
  {
    "table_name": "payment_proofs",
    "column_name": "payment_id",
    "constraint_name": "payment_proofs_ibfk_34",
    "referenced_table_name": "payments",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "CASCADE"
  },
  {
    "table_name": "payment_proofs",
    "column_name": "uploaded_by_user_id",
    "constraint_name": "payment_proofs_ibfk_35",
    "referenced_table_name": "users",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "NO ACTION"
  },
  {
    "table_name": "payment_proofs",
    "column_name": "reviewed_by_user_id",
    "constraint_name": "payment_proofs_ibfk_36",
    "referenced_table_name": "users",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "SET NULL"
  },
  {
    "table_name": "payment_status_logs",
    "column_name": "payment_id",
    "constraint_name": "payment_status_logs_ibfk_23",
    "referenced_table_name": "payments",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "CASCADE"
  },
  {
    "table_name": "payment_status_logs",
    "column_name": "actor_id",
    "constraint_name": "payment_status_logs_ibfk_24",
    "referenced_table_name": "users",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "SET NULL"
  },
  {
    "table_name": "stores",
    "column_name": "owner_user_id",
    "constraint_name": "stores_ibfk_25",
    "referenced_table_name": "users",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "CASCADE"
  },
  {
    "table_name": "stores",
    "column_name": "active_store_payment_profile_id",
    "constraint_name": "stores_ibfk_26",
    "referenced_table_name": "store_payment_profiles",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "SET NULL"
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "store_id",
    "constraint_name": "store_payment_profiles_ibfk_61",
    "referenced_table_name": "stores",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "CASCADE"
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "source_request_id",
    "constraint_name": "store_payment_profiles_ibfk_62",
    "referenced_table_name": "store_payment_profile_requests",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "SET NULL"
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "verified_by_admin_id",
    "constraint_name": "store_payment_profiles_ibfk_63",
    "referenced_table_name": "users",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "SET NULL"
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "activated_by_admin_id",
    "constraint_name": "store_payment_profiles_ibfk_64",
    "referenced_table_name": "users",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "SET NULL"
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "superseded_by_profile_id",
    "constraint_name": "store_payment_profiles_ibfk_65",
    "referenced_table_name": "store_payment_profiles",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "SET NULL"
  },
  {
    "table_name": "suborders",
    "column_name": "order_id",
    "constraint_name": "suborders_ibfk_1",
    "referenced_table_name": "orders",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "CASCADE"
  },
  {
    "table_name": "suborders",
    "column_name": "order_id",
    "constraint_name": "suborders_ibfk_13",
    "referenced_table_name": "orders",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "CASCADE"
  },
  {
    "table_name": "suborders",
    "column_name": "order_id",
    "constraint_name": "suborders_ibfk_17",
    "referenced_table_name": "orders",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "CASCADE"
  },
  {
    "table_name": "suborders",
    "column_name": "order_id",
    "constraint_name": "suborders_ibfk_21",
    "referenced_table_name": "orders",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "CASCADE"
  },
  {
    "table_name": "suborders",
    "column_name": "order_id",
    "constraint_name": "suborders_ibfk_25",
    "referenced_table_name": "orders",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "CASCADE"
  },
  {
    "table_name": "suborders",
    "column_name": "order_id",
    "constraint_name": "suborders_ibfk_29",
    "referenced_table_name": "orders",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "CASCADE"
  },
  {
    "table_name": "suborders",
    "column_name": "order_id",
    "constraint_name": "suborders_ibfk_33",
    "referenced_table_name": "orders",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "CASCADE"
  },
  {
    "table_name": "suborders",
    "column_name": "order_id",
    "constraint_name": "suborders_ibfk_37",
    "referenced_table_name": "orders",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "CASCADE"
  },
  {
    "table_name": "suborders",
    "column_name": "order_id",
    "constraint_name": "suborders_ibfk_41",
    "referenced_table_name": "orders",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "CASCADE"
  },
  {
    "table_name": "suborders",
    "column_name": "order_id",
    "constraint_name": "suborders_ibfk_45",
    "referenced_table_name": "orders",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "CASCADE"
  },
  {
    "table_name": "suborders",
    "column_name": "store_id",
    "constraint_name": "suborders_ibfk_46",
    "referenced_table_name": "stores",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "CASCADE"
  },
  {
    "table_name": "suborders",
    "column_name": "store_payment_profile_id",
    "constraint_name": "suborders_ibfk_47",
    "referenced_table_name": "store_payment_profiles",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "SET NULL"
  },
  {
    "table_name": "suborders",
    "column_name": "applied_coupon_id",
    "constraint_name": "suborders_ibfk_48",
    "referenced_table_name": "coupons",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "SET NULL"
  },
  {
    "table_name": "suborders",
    "column_name": "order_id",
    "constraint_name": "suborders_ibfk_5",
    "referenced_table_name": "orders",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "CASCADE"
  },
  {
    "table_name": "suborders",
    "column_name": "order_id",
    "constraint_name": "suborders_ibfk_9",
    "referenced_table_name": "orders",
    "referenced_column_name": "id",
    "update_rule": "CASCADE",
    "delete_rule": "CASCADE"
  }
]
```
## Enum Columns
Status: ok


```json
[
  {
    "table_name": "payments",
    "column_name": "payment_channel",
    "column_type": "enum('QRIS','DUITKU')"
  },
  {
    "table_name": "payments",
    "column_name": "payment_type",
    "column_type": "enum('QRIS_STATIC','DUITKU_POP')"
  },
  {
    "table_name": "payments",
    "column_name": "status",
    "column_type": "enum('CREATED','PENDING_CONFIRMATION','PAID','FAILED','CANCELLED','EXPIRED','REJECTED')"
  },
  {
    "table_name": "stores",
    "column_name": "status",
    "column_type": "enum('ACTIVE','INACTIVE')"
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "provider_code",
    "column_type": "enum('MANUAL_QRIS')"
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "payment_type",
    "column_type": "enum('QRIS_STATIC')"
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "snapshot_status",
    "column_type": "enum('ACTIVE','SUPERSEDED','INACTIVE')"
  },
  {
    "table_name": "store_payment_profiles",
    "column_name": "verification_status",
    "column_type": "enum('PENDING','ACTIVE','REJECTED','INACTIVE')"
  },
  {
    "table_name": "suborders",
    "column_name": "payment_method",
    "column_type": "enum('QRIS','DUITKU')"
  },
  {
    "table_name": "suborders",
    "column_name": "payment_status",
    "column_type": "enum('UNPAID','PENDING_CONFIRMATION','PAID','FAILED','EXPIRED','CANCELLED')"
  }
]
```
## Partial Duitku Tables
Status: ok


```json
[
  {
    "table_name": "duitku_callback_inbox"
  },
  {
    "table_name": "order_collection_claims"
  },
  {
    "table_name": "order_payment_attempts"
  },
  {
    "table_name": "order_payment_attempt_events"
  },
  {
    "table_name": "order_payment_security_events"
  }
]
```
## Partial Duitku Columns
Status: ok


```json
[
  {
    "table_name": "duitku_callback_inbox",
    "column_name": "id",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "PRI",
    "extra": "auto_increment"
  },
  {
    "table_name": "duitku_callback_inbox",
    "column_name": "payment_attempt_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "duitku_callback_inbox",
    "column_name": "resolved_payment_attempt_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "duitku_callback_inbox",
    "column_name": "merchant_code_raw",
    "column_type": "varchar(64)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "duitku_callback_inbox",
    "column_name": "merchant_order_id_raw",
    "column_type": "varchar(128)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "duitku_callback_inbox",
    "column_name": "provider_reference_raw",
    "column_type": "varchar(192)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "duitku_callback_inbox",
    "column_name": "amount_raw",
    "column_type": "varchar(64)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "duitku_callback_inbox",
    "column_name": "result_code_raw",
    "column_type": "varchar(40)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "duitku_callback_inbox",
    "column_name": "signature_state",
    "column_type": "enum('VALID')",
    "is_nullable": "NO",
    "column_default": "'VALID'",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "duitku_callback_inbox",
    "column_name": "binding_state",
    "column_type": "enum('BOUND','UNBOUND','AMBIGUOUS','RESOLVED')",
    "is_nullable": "NO",
    "column_default": "'UNBOUND'",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "duitku_callback_inbox",
    "column_name": "processing_result",
    "column_type": "enum('APPLIED','IGNORED','QUARANTINED','ERROR')",
    "is_nullable": "NO",
    "column_default": "'QUARANTINED'",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "duitku_callback_inbox",
    "column_name": "quarantine_reason",
    "column_type": "varchar(120)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "duitku_callback_inbox",
    "column_name": "occurrence_key",
    "column_type": "char(64)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "UNI",
    "extra": ""
  },
  {
    "table_name": "duitku_callback_inbox",
    "column_name": "event_hash",
    "column_type": "char(64)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "duitku_callback_inbox",
    "column_name": "raw_body_digest",
    "column_type": "char(64)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "duitku_callback_inbox",
    "column_name": "field_values_digest",
    "column_type": "char(64)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "duitku_callback_inbox",
    "column_name": "duplicate_count",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": "0",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "duitku_callback_inbox",
    "column_name": "first_received_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": "current_timestamp()",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "duitku_callback_inbox",
    "column_name": "last_received_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": "current_timestamp()",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "duitku_callback_inbox",
    "column_name": "resolved_at",
    "column_type": "datetime",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "duitku_callback_inbox",
    "column_name": "created_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": "current_timestamp()",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "duitku_callback_inbox",
    "column_name": "updated_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": "current_timestamp()",
    "column_key": "",
    "extra": "on update current_timestamp()"
  },
  {
    "table_name": "order_collection_claims",
    "column_name": "id",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "PRI",
    "extra": "auto_increment"
  },
  {
    "table_name": "order_collection_claims",
    "column_name": "order_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "UNI",
    "extra": ""
  },
  {
    "table_name": "order_collection_claims",
    "column_name": "rail",
    "column_type": "enum('DUITKU_POP','QRIS_STATIC')",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_collection_claims",
    "column_name": "claim_state",
    "column_type": "enum('CLAIMED','PAID','FAILED','EXPIRED','CANCELLED')",
    "is_nullable": "NO",
    "column_default": "'CLAIMED'",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_collection_claims",
    "column_name": "claim_source",
    "column_type": "enum('DUITKU_CREATE_INVOICE','QRIS_FALLBACK','ADMIN_RECOVERY')",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_collection_claims",
    "column_name": "order_payment_attempt_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_collection_claims",
    "column_name": "claimed_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": "current_timestamp()",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_collection_claims",
    "column_name": "paid_at",
    "column_type": "datetime",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_collection_claims",
    "column_name": "terminal_at",
    "column_type": "datetime",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_collection_claims",
    "column_name": "created_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": "current_timestamp()",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_collection_claims",
    "column_name": "updated_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": "current_timestamp()",
    "column_key": "",
    "extra": "on update current_timestamp()"
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "id",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "PRI",
    "extra": "auto_increment"
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "order_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "provider",
    "column_type": "enum('DUITKU')",
    "is_nullable": "NO",
    "column_default": "'DUITKU'",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "status",
    "column_type": "enum('CREATED','PENDING','PAID','FAILED','CANCELLED','EXPIRED','UNKNOWN')",
    "is_nullable": "NO",
    "column_default": "'CREATED'",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "requires_manual_review",
    "column_type": "tinyint(1)",
    "is_nullable": "NO",
    "column_default": "0",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "manual_review_reason",
    "column_type": "varchar(120)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "manual_review_created_at",
    "column_type": "datetime",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "manual_reviewed_by_user_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "manual_reviewed_at",
    "column_type": "datetime",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "merchant_order_id",
    "column_type": "varchar(50)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "UNI",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "provider_reference",
    "column_type": "varchar(160)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "UNI",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "payment_url",
    "column_type": "text",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "amount",
    "column_type": "bigint(20) unsigned",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "currency",
    "column_type": "char(3)",
    "is_nullable": "NO",
    "column_default": "'IDR'",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "expiry_period_minutes",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": "60",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "expires_at",
    "column_type": "datetime",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "created_at_provider",
    "column_type": "datetime",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "paid_at",
    "column_type": "datetime",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "cancelled_at",
    "column_type": "datetime",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "expired_at",
    "column_type": "datetime",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "idempotency_key_hash",
    "column_type": "char(64)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "request_fingerprint",
    "column_type": "char(64)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "provider_last_code",
    "column_type": "varchar(40)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "provider_last_message",
    "column_type": "varchar(255)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "last_reconciled_at",
    "column_type": "datetime",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "reconcile_attempt_count",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": "0",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "next_reconcile_at",
    "column_type": "datetime",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "last_reconcile_error_code",
    "column_type": "varchar(64)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "last_reconcile_error_at",
    "column_type": "datetime",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "created_by_user_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "created_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": "current_timestamp()",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempts",
    "column_name": "updated_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": "current_timestamp()",
    "column_key": "",
    "extra": "on update current_timestamp()"
  },
  {
    "table_name": "order_payment_attempt_events",
    "column_name": "id",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "PRI",
    "extra": "auto_increment"
  },
  {
    "table_name": "order_payment_attempt_events",
    "column_name": "payment_attempt_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempt_events",
    "column_name": "callback_inbox_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "UNI",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempt_events",
    "column_name": "event_type",
    "column_type": "enum('CREATE_INVOICE','CALLBACK','STATUS_CHECK','RECOVERY','RETURN_OBSERVED')",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempt_events",
    "column_name": "occurrence_key",
    "column_type": "char(64)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempt_events",
    "column_name": "provider_call_id",
    "column_type": "char(36)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempt_events",
    "column_name": "reconciliation_run_id",
    "column_type": "char(36)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempt_events",
    "column_name": "merchant_order_id",
    "column_type": "varchar(50)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempt_events",
    "column_name": "provider_reference",
    "column_type": "varchar(160)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempt_events",
    "column_name": "provider_amount_raw",
    "column_type": "varchar(64)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempt_events",
    "column_name": "amount_normalized",
    "column_type": "bigint(20) unsigned",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempt_events",
    "column_name": "provider_result_code",
    "column_type": "varchar(40)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempt_events",
    "column_name": "provider_status_code",
    "column_type": "varchar(40)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempt_events",
    "column_name": "payment_code",
    "column_type": "varchar(40)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempt_events",
    "column_name": "signature_state",
    "column_type": "enum('VALID','NOT_APPLICABLE','NOT_CHECKED')",
    "is_nullable": "NO",
    "column_default": "'NOT_CHECKED'",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempt_events",
    "column_name": "processing_result",
    "column_type": "enum('APPLIED','IGNORED','QUARANTINED','ERROR')",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempt_events",
    "column_name": "event_hash",
    "column_type": "char(64)",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempt_events",
    "column_name": "raw_body_digest",
    "column_type": "char(64)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempt_events",
    "column_name": "duplicate_count",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": "0",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempt_events",
    "column_name": "first_received_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": "current_timestamp()",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempt_events",
    "column_name": "last_received_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": "current_timestamp()",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempt_events",
    "column_name": "created_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": "current_timestamp()",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_attempt_events",
    "column_name": "updated_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": "current_timestamp()",
    "column_key": "",
    "extra": "on update current_timestamp()"
  },
  {
    "table_name": "order_payment_security_events",
    "column_name": "id",
    "column_type": "int(10) unsigned",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "PRI",
    "extra": "auto_increment"
  },
  {
    "table_name": "order_payment_security_events",
    "column_name": "event_type",
    "column_type": "enum('CALLBACK_INVALID_SIGNATURE','CALLBACK_MALFORMED','CALLBACK_OVERSIZED')",
    "is_nullable": "NO",
    "column_default": null,
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_payment_security_events",
    "column_name": "merchant_code_prefix",
    "column_type": "varchar(64)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_security_events",
    "column_name": "merchant_order_id_prefix",
    "column_type": "varchar(128)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_payment_security_events",
    "column_name": "provider_reference_prefix",
    "column_type": "varchar(192)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_security_events",
    "column_name": "amount_prefix",
    "column_type": "varchar(64)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_security_events",
    "column_name": "result_code_prefix",
    "column_type": "varchar(40)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_security_events",
    "column_name": "signature_state",
    "column_type": "enum('INVALID','NOT_CHECKED')",
    "is_nullable": "NO",
    "column_default": "'NOT_CHECKED'",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_payment_security_events",
    "column_name": "raw_body_digest",
    "column_type": "char(64)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_payment_security_events",
    "column_name": "field_values_digest",
    "column_type": "char(64)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_security_events",
    "column_name": "source_ip_hash",
    "column_type": "char(64)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_payment_security_events",
    "column_name": "user_agent_hash",
    "column_type": "char(64)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "order_payment_security_events",
    "column_name": "received_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": "current_timestamp()",
    "column_key": "MUL",
    "extra": ""
  },
  {
    "table_name": "order_payment_security_events",
    "column_name": "created_at",
    "column_type": "datetime",
    "is_nullable": "NO",
    "column_default": "current_timestamp()",
    "column_key": "",
    "extra": ""
  },
  {
    "table_name": "payments",
    "column_name": "allocation_key",
    "column_type": "varchar(160)",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "UNI",
    "extra": ""
  },
  {
    "table_name": "payments",
    "column_name": "paid_by_order_payment_attempt_id",
    "column_type": "int(10) unsigned",
    "is_nullable": "YES",
    "column_default": "NULL",
    "column_key": "MUL",
    "extra": ""
  }
]
```
## Partial Duitku Indexes
Status: ok


```json
[
  {
    "table_name": "duitku_callback_inbox",
    "index_name": "idx_dci_attempt",
    "non_unique": 1,
    "columns_in_order": "payment_attempt_id"
  },
  {
    "table_name": "duitku_callback_inbox",
    "index_name": "idx_dci_event_hash",
    "non_unique": 1,
    "columns_in_order": "event_hash"
  },
  {
    "table_name": "duitku_callback_inbox",
    "index_name": "idx_dci_last_received",
    "non_unique": 1,
    "columns_in_order": "last_received_at"
  },
  {
    "table_name": "duitku_callback_inbox",
    "index_name": "idx_dci_merchant_code",
    "non_unique": 1,
    "columns_in_order": "merchant_code_raw"
  },
  {
    "table_name": "duitku_callback_inbox",
    "index_name": "idx_dci_merchant_order",
    "non_unique": 1,
    "columns_in_order": "merchant_order_id_raw"
  },
  {
    "table_name": "duitku_callback_inbox",
    "index_name": "idx_dci_processing",
    "non_unique": 1,
    "columns_in_order": "processing_result"
  },
  {
    "table_name": "duitku_callback_inbox",
    "index_name": "idx_dci_quarantine",
    "non_unique": 1,
    "columns_in_order": "quarantine_reason,first_received_at"
  },
  {
    "table_name": "duitku_callback_inbox",
    "index_name": "idx_dci_raw_body_digest",
    "non_unique": 1,
    "columns_in_order": "raw_body_digest"
  },
  {
    "table_name": "duitku_callback_inbox",
    "index_name": "idx_dci_received",
    "non_unique": 1,
    "columns_in_order": "first_received_at"
  },
  {
    "table_name": "duitku_callback_inbox",
    "index_name": "idx_dci_reference",
    "non_unique": 1,
    "columns_in_order": "provider_reference_raw"
  },
  {
    "table_name": "duitku_callback_inbox",
    "index_name": "idx_dci_resolved_at",
    "non_unique": 1,
    "columns_in_order": "resolved_at"
  },
  {
    "table_name": "duitku_callback_inbox",
    "index_name": "idx_dci_resolved_attempt",
    "non_unique": 1,
    "columns_in_order": "resolved_payment_attempt_id"
  },
  {
    "table_name": "duitku_callback_inbox",
    "index_name": "idx_dci_result_code",
    "non_unique": 1,
    "columns_in_order": "result_code_raw"
  },
  {
    "table_name": "duitku_callback_inbox",
    "index_name": "idx_dci_signature_binding",
    "non_unique": 1,
    "columns_in_order": "signature_state,binding_state"
  },
  {
    "table_name": "duitku_callback_inbox",
    "index_name": "PRIMARY",
    "non_unique": 0,
    "columns_in_order": "id"
  },
  {
    "table_name": "duitku_callback_inbox",
    "index_name": "uniq_dci_occurrence",
    "non_unique": 0,
    "columns_in_order": "occurrence_key"
  },
  {
    "table_name": "order_collection_claims",
    "index_name": "idx_occ_attempt",
    "non_unique": 1,
    "columns_in_order": "order_payment_attempt_id"
  },
  {
    "table_name": "order_collection_claims",
    "index_name": "idx_occ_claimed_at",
    "non_unique": 1,
    "columns_in_order": "claimed_at"
  },
  {
    "table_name": "order_collection_claims",
    "index_name": "idx_occ_paid_at",
    "non_unique": 1,
    "columns_in_order": "paid_at"
  },
  {
    "table_name": "order_collection_claims",
    "index_name": "idx_occ_rail_state",
    "non_unique": 1,
    "columns_in_order": "rail,claim_state"
  },
  {
    "table_name": "order_collection_claims",
    "index_name": "idx_occ_source",
    "non_unique": 1,
    "columns_in_order": "claim_source"
  },
  {
    "table_name": "order_collection_claims",
    "index_name": "idx_occ_terminal_at",
    "non_unique": 1,
    "columns_in_order": "terminal_at"
  },
  {
    "table_name": "order_collection_claims",
    "index_name": "PRIMARY",
    "non_unique": 0,
    "columns_in_order": "id"
  },
  {
    "table_name": "order_collection_claims",
    "index_name": "uniq_occ_order_id",
    "non_unique": 0,
    "columns_in_order": "order_id"
  },
  {
    "table_name": "order_payment_attempts",
    "index_name": "fk_opa_created_user",
    "non_unique": 1,
    "columns_in_order": "created_by_user_id"
  },
  {
    "table_name": "order_payment_attempts",
    "index_name": "fk_opa_manual_user",
    "non_unique": 1,
    "columns_in_order": "manual_reviewed_by_user_id"
  },
  {
    "table_name": "order_payment_attempts",
    "index_name": "idx_opa_amount",
    "non_unique": 1,
    "columns_in_order": "amount"
  },
  {
    "table_name": "order_payment_attempts",
    "index_name": "idx_opa_created_at",
    "non_unique": 1,
    "columns_in_order": "created_at"
  },
  {
    "table_name": "order_payment_attempts",
    "index_name": "idx_opa_expires_at",
    "non_unique": 1,
    "columns_in_order": "expires_at"
  },
  {
    "table_name": "order_payment_attempts",
    "index_name": "idx_opa_manual_review_queue",
    "non_unique": 1,
    "columns_in_order": "requires_manual_review,status,manual_review_created_at"
  },
  {
    "table_name": "order_payment_attempts",
    "index_name": "idx_opa_order_status",
    "non_unique": 1,
    "columns_in_order": "order_id,status"
  },
  {
    "table_name": "order_payment_attempts",
    "index_name": "idx_opa_paid_at",
    "non_unique": 1,
    "columns_in_order": "paid_at"
  },
  {
    "table_name": "order_payment_attempts",
    "index_name": "idx_opa_provider_status",
    "non_unique": 1,
    "columns_in_order": "provider,status"
  },
  {
    "table_name": "order_payment_attempts",
    "index_name": "idx_opa_reconcile_due",
    "non_unique": 1,
    "columns_in_order": "next_reconcile_at,status,reconcile_attempt_count"
  },
  {
    "table_name": "order_payment_attempts",
    "index_name": "idx_opa_request_fingerprint",
    "non_unique": 1,
    "columns_in_order": "request_fingerprint"
  },
  {
    "table_name": "order_payment_attempts",
    "index_name": "PRIMARY",
    "non_unique": 0,
    "columns_in_order": "id"
  },
  {
    "table_name": "order_payment_attempts",
    "index_name": "uniq_opa_merchant_order_id",
    "non_unique": 0,
    "columns_in_order": "merchant_order_id"
  },
  {
    "table_name": "order_payment_attempts",
    "index_name": "uniq_opa_order_idempotency",
    "non_unique": 0,
    "columns_in_order": "order_id,idempotency_key_hash"
  },
  {
    "table_name": "order_payment_attempts",
    "index_name": "uniq_opa_provider_reference",
    "non_unique": 0,
    "columns_in_order": "provider_reference"
  },
  {
    "table_name": "order_payment_attempt_events",
    "index_name": "idx_opae_attempt_id",
    "non_unique": 1,
    "columns_in_order": "payment_attempt_id"
  },
  {
    "table_name": "order_payment_attempt_events",
    "index_name": "idx_opae_event_hash",
    "non_unique": 1,
    "columns_in_order": "event_hash"
  },
  {
    "table_name": "order_payment_attempt_events",
    "index_name": "idx_opae_first_received_at",
    "non_unique": 1,
    "columns_in_order": "first_received_at"
  },
  {
    "table_name": "order_payment_attempt_events",
    "index_name": "idx_opae_last_received_at",
    "non_unique": 1,
    "columns_in_order": "last_received_at"
  },
  {
    "table_name": "order_payment_attempt_events",
    "index_name": "idx_opae_merchant_order_id",
    "non_unique": 1,
    "columns_in_order": "merchant_order_id"
  },
  {
    "table_name": "order_payment_attempt_events",
    "index_name": "idx_opae_processing_result",
    "non_unique": 1,
    "columns_in_order": "processing_result"
  },
  {
    "table_name": "order_payment_attempt_events",
    "index_name": "idx_opae_provider_call_id",
    "non_unique": 1,
    "columns_in_order": "provider_call_id"
  },
  {
    "table_name": "order_payment_attempt_events",
    "index_name": "idx_opae_provider_reference",
    "non_unique": 1,
    "columns_in_order": "provider_reference"
  },
  {
    "table_name": "order_payment_attempt_events",
    "index_name": "idx_opae_reconciliation_run_id",
    "non_unique": 1,
    "columns_in_order": "reconciliation_run_id"
  },
  {
    "table_name": "order_payment_attempt_events",
    "index_name": "idx_opae_result_code",
    "non_unique": 1,
    "columns_in_order": "provider_result_code"
  },
  {
    "table_name": "order_payment_attempt_events",
    "index_name": "idx_opae_signature_state",
    "non_unique": 1,
    "columns_in_order": "signature_state"
  },
  {
    "table_name": "order_payment_attempt_events",
    "index_name": "idx_opae_status_code",
    "non_unique": 1,
    "columns_in_order": "provider_status_code"
  },
  {
    "table_name": "order_payment_attempt_events",
    "index_name": "PRIMARY",
    "non_unique": 0,
    "columns_in_order": "id"
  },
  {
    "table_name": "order_payment_attempt_events",
    "index_name": "uniq_opae_callback_inbox",
    "non_unique": 0,
    "columns_in_order": "callback_inbox_id"
  },
  {
    "table_name": "order_payment_attempt_events",
    "index_name": "uniq_opae_occurrence",
    "non_unique": 0,
    "columns_in_order": "payment_attempt_id,event_type,occurrence_key"
  },
  {
    "table_name": "order_payment_security_events",
    "index_name": "idx_opse_ip_time",
    "non_unique": 1,
    "columns_in_order": "source_ip_hash,received_at"
  },
  {
    "table_name": "order_payment_security_events",
    "index_name": "idx_opse_order_prefix",
    "non_unique": 1,
    "columns_in_order": "merchant_order_id_prefix"
  },
  {
    "table_name": "order_payment_security_events",
    "index_name": "idx_opse_raw_digest",
    "non_unique": 1,
    "columns_in_order": "raw_body_digest"
  },
  {
    "table_name": "order_payment_security_events",
    "index_name": "idx_opse_received",
    "non_unique": 1,
    "columns_in_order": "received_at"
  },
  {
    "table_name": "order_payment_security_events",
    "index_name": "idx_opse_signature",
    "non_unique": 1,
    "columns_in_order": "signature_state"
  },
  {
    "table_name": "order_payment_security_events",
    "index_name": "idx_opse_type_received",
    "non_unique": 1,
    "columns_in_order": "event_type,received_at"
  },
  {
    "table_name": "order_payment_security_events",
    "index_name": "PRIMARY",
    "non_unique": 0,
    "columns_in_order": "id"
  },
  {
    "table_name": "payments",
    "index_name": "idx_payments_paid_by_attempt",
    "non_unique": 1,
    "columns_in_order": "paid_by_order_payment_attempt_id"
  },
  {
    "table_name": "payments",
    "index_name": "internal_reference",
    "non_unique": 0,
    "columns_in_order": "internal_reference"
  },
  {
    "table_name": "payments",
    "index_name": "internal_reference_10",
    "non_unique": 0,
    "columns_in_order": "internal_reference"
  },
  {
    "table_name": "payments",
    "index_name": "internal_reference_11",
    "non_unique": 0,
    "columns_in_order": "internal_reference"
  },
  {
    "table_name": "payments",
    "index_name": "internal_reference_12",
    "non_unique": 0,
    "columns_in_order": "internal_reference"
  },
  {
    "table_name": "payments",
    "index_name": "internal_reference_13",
    "non_unique": 0,
    "columns_in_order": "internal_reference"
  },
  {
    "table_name": "payments",
    "index_name": "internal_reference_2",
    "non_unique": 0,
    "columns_in_order": "internal_reference"
  },
  {
    "table_name": "payments",
    "index_name": "internal_reference_3",
    "non_unique": 0,
    "columns_in_order": "internal_reference"
  },
  {
    "table_name": "payments",
    "index_name": "internal_reference_4",
    "non_unique": 0,
    "columns_in_order": "internal_reference"
  },
  {
    "table_name": "payments",
    "index_name": "internal_reference_5",
    "non_unique": 0,
    "columns_in_order": "internal_reference"
  },
  {
    "table_name": "payments",
    "index_name": "internal_reference_6",
    "non_unique": 0,
    "columns_in_order": "internal_reference"
  },
  {
    "table_name": "payments",
    "index_name": "internal_reference_7",
    "non_unique": 0,
    "columns_in_order": "internal_reference"
  },
  {
    "table_name": "payments",
    "index_name": "internal_reference_8",
    "non_unique": 0,
    "columns_in_order": "internal_reference"
  },
  {
    "table_name": "payments",
    "index_name": "internal_reference_9",
    "non_unique": 0,
    "columns_in_order": "internal_reference"
  },
  {
    "table_name": "payments",
    "index_name": "PRIMARY",
    "non_unique": 0,
    "columns_in_order": "id"
  },
  {
    "table_name": "payments",
    "index_name": "store_id",
    "non_unique": 1,
    "columns_in_order": "store_id"
  },
  {
    "table_name": "payments",
    "index_name": "store_payment_profile_id",
    "non_unique": 1,
    "columns_in_order": "store_payment_profile_id"
  },
  {
    "table_name": "payments",
    "index_name": "suborder_id",
    "non_unique": 1,
    "columns_in_order": "suborder_id"
  },
  {
    "table_name": "payments",
    "index_name": "uniq_payments_allocation_key",
    "non_unique": 0,
    "columns_in_order": "allocation_key"
  }
]
```
## Migration Records
Status: ok


```json
[
  {
    "filename": "20260806090000-add-duitku-payment-foundation.cjs",
    "created_at": "2026-08-06T11:58:54.000Z"
  }
]
```
## Orphan Suborders
Status: ok


```json
[]
```
## Orphan Payments
Status: ok


```json
[]
```
## Order Amount Anomalies
Status: ok


```json
[]
```
## QRIS Active Profile Readiness Sampling
Status: ok


```json
[]
```
## Review Notes

- No DDL was executed by this script.
- No migration rows were inserted or updated by this script.
- Migration approval remains blocked until this artifact is reviewed.
- Add reviewer, owner, and remediation notes before using this report for gate approval.
