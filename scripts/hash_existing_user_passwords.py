from argon2 import PasswordHasher
from app.db import my_pool


password_hasher = PasswordHasher()


def migrate_passwords():
    my_conn = None
    my_cursor = None

    try:
        my_conn = my_pool.get_connection()
        my_conn.start_transaction()

        my_cursor = my_conn.cursor(dictionary=True)

        sql = """
            SELECT id, password
            FROM user
            FOR UPDATE
        """
        my_cursor.execute(sql)
        users = my_cursor.fetchall()

        updated_count = 0
        skipped_count = 0

        for user in users:
            stored_password = user["password"]

            if is_argon2_hash(stored_password):
                skipped_count += 1
                continue

            password_hash = password_hasher.hash(stored_password)

            sql = """
            UPDATE user
            SET password = %s
            WHERE id = %s
            """
            val = (password_hash, user["id"])
            my_cursor.execute(sql, val)

            updated_count += 1

        my_conn.commit()

        print(f"Updated: {updated_count}")
        print(f"Skipped: {skipped_count}")

    except Exception:
        if my_conn is not None:
            my_conn.rollback()
        raise

    finally:
        if my_cursor is not None:
            my_cursor.close()

        if my_conn is not None:
            my_conn.close()


def is_argon2_hash(value):
    return isinstance(value, str) and value.startswith("$argon2")


if __name__ == "__main__":
    migrate_passwords()