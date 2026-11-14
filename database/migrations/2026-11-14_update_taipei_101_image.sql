START TRANSACTION;

UPDATE image_url iu
JOIN attraction a ON a.id = iu.attraction_id
SET iu.url = 'https://www.travel.taipei/image/573619'
WHERE a.attraction_name = '台北101'
  AND iu.url = 'https://www.travel.taipei/image/64607';

COMMIT;