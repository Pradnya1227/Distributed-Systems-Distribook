#!/bin/bash
psql -U postgres -d distribook -c "SELECT id, \"bookingId\", \"userEmail\", \"message\", \"createdAt\" FROM \"notification\".\"Notification\" WHERE \"bookingId\"='083cf83e-ce1c-42ed-b7d3-d7e3f4c4df8b' ORDER BY \"createdAt\";"
