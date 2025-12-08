#!/bin/bash
# Wait for SQL Server to start
sleep 30s
# Run the setup script to create the DB and the schema in the DB
/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P StrongPassw0rd!123 -d master -i /init.sql
