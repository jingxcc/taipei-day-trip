# Password Hash Migration

將 `user` 資料表中原本以明文儲存的密碼轉換為 Argon2 hash。

## 相關檔案

- `app/routes/user.py`
  - 註冊時使用 Argon2 hash 密碼。
  - 登入時使用 Argon2 驗證密碼。
  - Argon2 參數改變時，可在登入成功後重新 hash。
- `scripts/hash_existing_user_passwords.py`
  - 將既有明文密碼轉換為 Argon2 hash。
  - 已經是 Argon2 格式的資料會跳過。
  - 發生錯誤時會 rollback transaction。
- `requirements.txt`
  - 加入 `argon2-cffi`。

> Migration script 僅適用於既有密碼仍為明文的情況。

## Migration 步驟

1. 停止 Flask 服務。
2. 備份 EC2 資料庫。
3. 部署新版程式。
4. 安裝 dependencies：

   ```bash
   .venv/bin/python -m pip install -r requirements.txt
   ```

5. 從專案根目錄（`taipei-day-trip/`）執行 migration：

   ```bash
   .venv/bin/python scripts/hash_existing_user_passwords.py
   ```

6. 確認所有密碼皆已轉換。
7. 啟動 Flask 並測試登入及註冊。

## 驗證

### 檢查密碼格式：

```sql
SELECT
    id,
    email,
    LEFT(password, 10) AS password_prefix,
    LENGTH(password) AS password_length
FROM user;
```

`password_prefix` 應為 `$argon2id$`。

### 確認沒有尚未轉換的資料：

```sql
SELECT id, email
FROM user
WHERE password NOT LIKE '$argon2%';
```

預期結果為空。
