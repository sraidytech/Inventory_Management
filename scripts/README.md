# Notification System Scripts

This directory contains scripts for the notification system, including payment due date notifications and stock level alerts.

## Payment Due Date Notification System

The payment due date notification system checks for transactions with payment due dates in the next 7 days and creates notifications for them.

### How It Works

1. The system uses the `/api/notifications/payment-due-check` API endpoint to check for transactions with payment due dates in the next 7 days.
2. For each transaction found, it creates notifications in both English and Arabic.
3. Notifications are only created once per day for each transaction.
4. The script is designed to be run daily using a cron job or a scheduled task.

### Running the Script Manually

```bash
cd scripts
npm run check-payments
```

## Stock Level Alert System

The stock level alert system checks for products with stock levels below their minimum quantity and creates notifications for them.

### How It Works

1. The system uses the `/api/notifications/stock-alerts` API endpoint to check for products with stock levels below their minimum quantity.
2. For each low stock product found, it creates notifications in both English and Arabic.
3. Notifications are only created once per day for each product.
4. The script is designed to be run daily using a cron job or a scheduled task.

### Running the Script Manually

```bash
cd scripts
npm run check-stock
```

## Setting Up Scheduled Tasks

### Windows (Task Scheduler)

1. Open Task Scheduler
2. Click "Create Basic Task"
3. Enter a name and description (e.g., "Inventory Management Notifications")
4. Set the trigger to "Daily" and choose a time (e.g., 9:00 AM)
5. Choose "Start a program" as the action
6. Browse to the Node.js executable (e.g., `C:\Program Files\nodejs\node.exe`)
7. Add the script path as an argument (e.g., `C:\path\to\inventory-management\client\scripts\check-payment-due-dates.js` or `C:\path\to\inventory-management\client\scripts\check-stock-levels.js`)
8. Set the "Start in" directory to the scripts directory (e.g., `C:\path\to\inventory-management\client\scripts`)
9. Complete the wizard
10. Repeat for each script you want to schedule

### Linux/macOS (Cron Job)

1. Open your crontab file:

```bash
crontab -e
```

2. Add lines to run the scripts daily at specific times:

```
# Run payment due check at 9:00 AM
0 9 * * * cd /path/to/inventory-management/client/scripts && node check-payment-due-dates.js

# Run stock level check at 9:30 AM
30 9 * * * cd /path/to/inventory-management/client/scripts && node check-stock-levels.js
```

## Customization

You can customize each script by modifying the following settings at the top of the respective script files:

- `API_URL`: The URL of the API endpoint to check
- `TIMEOUT`: The timeout for the HTTP request in milliseconds
