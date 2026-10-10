# Checkout Order Migration

Migration:

`2026-08-30_refactor_checkout_order.sql`

本次 migration 會修改 `order` table `order_status` 的型別與資料內容。執行期間必須停止舊版後端寫入，避免舊程式繼續寫入數字狀態。

## Migration 步驟

1. 停止舊版後端寫入
2. 執行 migration 前驗證
3. 備份目標資料庫
4. 執行 migration
5. 執行 migration 後驗證
6. 部署新版後端
7. 執行基本付款流程測試
8. 恢復對外服務

## Migration 前驗證

### 訂單總數

```sql
SELECT COUNT(*) AS total_orders
FROM `order`;
```

### 舊訂單狀態分布

```sql
SELECT order_status, COUNT(*) AS order_count
FROM `order`
GROUP BY order_status;
```

確認只有狀態 `0` 和 `1`。

## Migration 後驗證

### 訂單總數

```sql
SELECT COUNT(*) AS total_orders
FROM `order`;
```

訂單總數與 migration 前相同。

### 新訂單狀態分布

```sql
SELECT order_status, COUNT(*) AS order_count
FROM `order`
GROUP BY order_status;
```

確認只出現 `FAILED` 和 `PAID`，且 migration 前 `0`、`1` 的數量分別等於 migration 後 `FAILED`、`PAID` 的數量。

### Schema 檢查

確認資料庫中 `order` table 的實際 schema 與 `database/tables/order.sql` 一致。
