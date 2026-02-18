#!/usr/bin/env python
"""Script to initialize MySQL database"""
import pymysql


def create_database():
    """Create the database if it doesn't exist"""
    try:
        conn = pymysql.connect(host='localhost', user='root', password='')
        cursor = conn.cursor()
        cursor.execute(
            "CREATE DATABASE IF NOT EXISTS NexasolftTreasury "
            "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        )
        conn.close()
        print("Database created/verified successfully!")
        return True
    except Exception as e:
        print(f"Error creating database: {e}")
        return False


if __name__ == "__main__":
    create_database()
