-- Add order_id to order_contact and backfill existing records.
-- IMPORTANT:
-- Review the generated order-contact mappings before executing Step 4 (UPDATE).

-- 1. Add order_id as nullable for existing rows.
ALTER TABLE order_contact
ADD COLUMN order_id BIGINT NULL AFTER id;

-- 2. Match orders and contacts by creation order within each user.
DROP TEMPORARY TABLE IF EXISTS order_contact_mapping;

CREATE TEMPORARY TABLE order_contact_mapping AS
WITH ranked_orders AS (
    SELECT
        id AS order_id,
        user_id,
        ROW_NUMBER() OVER (
            PARTITION BY user_id
            ORDER BY id
        ) AS row_num
    FROM `order`
),
ranked_contacts AS (
    SELECT
        id AS contact_id,
        user_id,
        ROW_NUMBER() OVER (
            PARTITION BY user_id
            ORDER BY id
        ) AS row_num
    FROM order_contact
)
SELECT
    o.user_id,
    o.order_id,
    c.contact_id,
    o.row_num
FROM ranked_orders AS o
JOIN ranked_contacts AS c
    ON o.user_id = c.user_id
   AND o.row_num = c.row_num;

-- 3. Review the generated mappings before updating.
SELECT
    mapping.user_id,
    mapping.order_id,
    o.order_no,
    o.create_date AS order_created_at,
    mapping.contact_id,
    oc.contact_name,
    oc.contact_email,
    oc.contact_phone
FROM order_contact_mapping AS mapping
JOIN `order` AS o
    ON o.id = mapping.order_id
JOIN order_contact AS oc
    ON oc.id = mapping.contact_id
ORDER BY
    mapping.user_id,
    mapping.row_num;


-- 4. Backfill order_id.
UPDATE order_contact AS oc
JOIN order_contact_mapping AS mapping
    ON oc.id = mapping.contact_id
SET oc.order_id = mapping.order_id;

-- 5. Verify the backfilled data.

-- No contact should have a null order_id.
SELECT *
FROM order_contact
WHERE order_id IS NULL;

-- Each order should have at most one contact record.
SELECT
    order_id,
    COUNT(*) AS contact_count
FROM order_contact
GROUP BY order_id
HAVING COUNT(*) > 1;

-- The number of mapped rows should match the number of contact rows.
SELECT
    (SELECT COUNT(*) FROM order_contact) AS contact_count,
    (SELECT COUNT(*) FROM `order`) AS order_count,
    (SELECT COUNT(*) FROM order_contact_mapping) AS mapping_count;


-- 6. Add constraints after verification.
ALTER TABLE order_contact
MODIFY COLUMN order_id BIGINT NOT NULL;

ALTER TABLE order_contact
ADD CONSTRAINT uq_order_contact_order_id
UNIQUE (order_id);

ALTER TABLE order_contact
ADD CONSTRAINT fk_order_contact_order
FOREIGN KEY (order_id) REFERENCES `order` (id);

