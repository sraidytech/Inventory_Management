# Payment Due Date Notification System

This directory contains scripts for the payment due date notification system. The system checks for transactions with payment due dates in the next 7 days and creates notifications for them.

## How It Works

1. The system uses the `/api/notifications/payment-due-check` API endpoint to check for transactions with payment due dates in the next 7 days.
2. For each transaction found, it creates notifications in both English and Arabic.
3. Notifications are only created once per day for each transaction.
4. The script is designed to be run daily using a cron job or a scheduled task.

## Setup

### Running the Script Manually

You can run the script manually using the following command:

```bash
cd scripts
npm run check-payments
```

### Setting Up a Scheduled Task (Windows)

1. Open Task Scheduler
2. Click "Create Basic Task"
3. Enter a name and description (e.g., "Payment Due Date Notifications")
4. Set the trigger to "Daily" and choose a time (e.g., 9:00 AM)
5. Choose "Start a program" as the action
6. Browse to the Node.js executable (e.g., `C:\Program Files\nodejs\node.exe`)
7. Add the script path as an argument (e.g., `C:\path\to\inventory-management\client\scripts\check-payment-due-dates.js`)
8. Set the "Start in" directory to the scripts directory (e.g., `C:\path\to\inventory-management\client\scripts`)
9. Complete the wizard

### Setting Up a Cron Job (Linux/macOS)

1. Open your crontab file:

```bash
crontab -e
```

2. Add a line to run the script daily at a specific time (e.g., 9:00 AM):

```
0 9 * * * cd /path/to/inventory-management/client/scripts && node check-payment-due-dates.js
```

## Customization

You can customize the script by modifying the following:

- `API_URL`: The URL of the API endpoint to check for payment due dates
- `TIMEOUT`: The timeout for the HTTP request in milliseconds

These settings can be found at the top of the `check-payment-due-dates.js` file.
