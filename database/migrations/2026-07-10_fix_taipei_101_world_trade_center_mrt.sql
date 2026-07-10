START TRANSACTION;

-- Get MRT IDs
SET @taipei101_id = (
    SELECT id
    FROM mrt
    WHERE mrt_name = '台北101'
);

SET @world_trade_id = (
    SELECT id
    FROM mrt
    WHERE mrt_name = '世貿'
);

-- Create the new MRT station if it does not exist.
INSERT INTO mrt (mrt_name)
SELECT '台北101／世貿'
WHERE NOT EXISTS (
    SELECT 1
    FROM mrt
    WHERE mrt_name = '台北101／世貿'
);

SET @new_mrt_id = (
    SELECT id
    FROM mrt
    WHERE mrt_name = '台北101／世貿'
);

-- Create new MRT mappings.
INSERT IGNORE INTO attraction_mrt (
    attraction_id,
    mrt_id
)
SELECT
    attraction_id,
    @new_mrt_id
FROM attraction_mrt
WHERE mrt_id IN (@taipei101_id, @world_trade_id);

-- Remove legacy MRT mappings.
DELETE FROM attraction_mrt
WHERE mrt_id IN (@taipei101_id, @world_trade_id);

-- Remove legacy MRT stations.
DELETE FROM mrt
WHERE id IN (@taipei101_id, @world_trade_id);

COMMIT;

-- Verification
--
-- SELECT
--     a.id AS attraction_id,
--     a.attraction_name,
--     m.mrt_name
-- FROM attraction_mrt am
-- JOIN attraction a ON a.id = am.attraction_id
-- JOIN mrt m ON m.id = am.mrt_id
-- WHERE m.mrt_name = '台北101／世貿';