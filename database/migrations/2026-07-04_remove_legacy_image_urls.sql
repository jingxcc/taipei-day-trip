-- Remove obsolete image URLs from the legacy Taipei Open API.

DELETE iu FROM image_url iu
JOIN (
    SELECT id
    FROM image_url
    WHERE url LIKE "%d_upload_ttn%"
) AS legacy
ON iu.id = legacy.id;