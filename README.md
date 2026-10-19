# Relay WhatsApp message desk

Relay is a small web dashboard for sending individual plain-text messages
through the WhatsApp Cloud API and viewing recent send attempts.

## What you need

- Node.js 20 or newer and npm
- A Meta account that can access [Meta for Developers](https://developers.facebook.com/)
- A WhatsApp Business Platform app, an access token, and the sender's **Phone
  number ID**
- A recipient who has agreed to receive your messages. For test mode, use a
  recipient number you can verify and add in the Meta app's API Setup page.

The WhatsApp Cloud API is not the same as a personal WhatsApp account or the
WhatsApp Business mobile app. This dashboard uses credentials for the
WhatsApp Business Platform (Cloud API).

## Part 1: Create a WhatsApp Cloud API app

1. Sign in at [Meta for Developers](https://developers.facebook.com/). Complete
   developer registration if Meta asks you to.
2. Open [My Apps](https://developers.facebook.com/apps/) and choose **Create
   App**.
3. Enter an app name and contact email. For the use case, select **Connect with
   customers through WhatsApp** (wording may vary slightly in Meta's interface),
   then continue.
4. Select the business portfolio to associate with the app, or follow Meta's
   prompts to create one. Review the details and create the app.
5. In the new app dashboard, open the WhatsApp setup/quickstart and choose
   **Start using the API** or **API Setup**.
6. Connect or create a WhatsApp Business Account (sometimes labeled a
   **Messaging account**) when prompted. Meta may provide a test business
   number automatically.

Meta changes dashboard labels from time to time. The official walkthrough is
[WhatsApp Cloud API: Get Started](https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started).

## Part 2: Get the values for `.env`

Keep the Meta API Setup page open. You need two values from it:

### 1. Access token

For your first local test:

1. On the app's **API Setup** page, click **Generate access token**.
2. Approve the requested access for the WhatsApp Business Account.
3. Copy the generated token. Treat it like a password. Meta's setup token is
   temporary and expires; it is suitable for testing, not for a server you
   depend on.

For ongoing use, create a system-user token instead of relying on the
temporary setup token:

1. Open [Meta Business Settings](https://business.facebook.com/latest/settings)
   and select **Users → System users**.
2. Create a system user. Assign it access to both your Meta app and the
   WhatsApp Business Account. For this dashboard it needs permission to send
   WhatsApp messages; Meta's current Cloud API setup guide lists
   `whatsapp_business_messaging` and `whatsapp_business_management`, and may
   also require `business_management` for the system-user setup.
3. Choose **Generate token**, select your app, and grant the requested
   permissions. Copy and securely store the token when Meta shows it; you may
   not be able to view the same token again.
4. If Meta's interface does not let you assign the assets or generate the
   needed permissions, confirm that the system user and app belong to the
   correct business portfolio and that you have sufficient business access.

System-user setup details are in Meta's
[Get Started guide](https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started#step-5-create-a-system-user-and-generate-a-permanent-access-token).
Meta controls token lifetimes and permission availability; check the token
details in Business Settings and rotate/revoke a token if it is exposed.

### 2. Phone number ID

On the app's **WhatsApp → API Setup** page, find the sender phone number
section. Copy the value labeled **Phone number ID**. It is a numeric ID
associated with the sender, not the visible phone number, not the WhatsApp
Business Account ID, and not the recipient's number.

In test mode, Meta displays a test phone number and its Phone number ID. To
send to yourself or another test recipient, add that person's WhatsApp number
in the **To** / recipient area of API Setup and complete Meta's verification
prompt. Use the same sender number and Phone number ID in Relay. For a real
business sender, add/register the business phone number in the WhatsApp
Business Account and use the Phone number ID shown for that number.

## Part 3: Put the credentials in this project's `.env`

Run these commands from the project root (the directory containing
`package.json`):

```sh
npm install
cp .env.example .env
```

Run the `cp` command only when you do not already have a `.env` file; it
overwrites an existing file. If `.env` already exists, open it and update the
values there instead.

Open `.env` in VS Code and replace the empty values. It should look like this
(the example values below are placeholders; do not copy them as credentials):

```dotenv
WHATSAPP_ACCESS_TOKEN=paste_your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=paste_your_phone_number_id_here
WHATSAPP_API_VERSION=v23.0
WHATSAPP_DISPLAY_NAME=My WhatsApp Business
PORT=3001
```

Use the exact token and Phone number ID you copied from Meta. Do not include
`Bearer`, do not add spaces around `=`, and do not put either value in the
React/Vite frontend or in a `VITE_...` variable. The access token must remain
server-side. If a value contains special characters, dotenv also accepts a
quoted value, for example `WHATSAPP_ACCESS_TOKEN="paste_token_here"`.

`WHATSAPP_DISPLAY_NAME` is optional and only labels the sender in the status
endpoint; it does not change the sender configured by Meta. The API version
defaults to `v23.0` in this project. Use a version supported by Meta for your
app if you intentionally update it. `PORT` defaults to `3001`.

The `.env` file is excluded by `.gitignore`. Never commit it, paste its values
into an issue/chat, or share screenshots that show the token. If you
accidentally expose a token, revoke it in Meta Business Settings and generate
a replacement.

## Part 4: Start Relay and test

Start the app in development mode:

```sh
npm run dev
```

Open the local URL printed by Vite. The connection indicator should show
**Connected** when the server has loaded both the token and Phone number ID.
If you edited `.env` after starting the server, stop and restart `npm run dev`
so the server reads the new values.

To test sending:

1. In Meta API Setup, make sure the recipient is added as a test recipient
   (when using the test sender) and has completed verification.
2. In Relay, enter the recipient's number in international format. The form
   accepts digits with optional spaces, parentheses, hyphens, and a leading
   `+`; for example, `+1 415 555 0138`.
3. Enter a message and click **Send message**. The result appears in Recent
   activity.

The current dashboard sends plain-text messages, not templates. WhatsApp
generally permits free-form messages only during the 24-hour customer-service
window after the recipient messages the business. To contact someone outside
that window, use an approved WhatsApp message template; template sending is not
implemented in this dashboard. Follow Meta's opt-in and messaging policies
and do not send unsolicited messages.

## Running a production build

Build and start the app with:

```sh
npm run build
npm start
```

The server serves the production frontend and API on port `3001` by default.
Set `PORT` in `.env` to change the port. Keep the `.env` file and server
environment private when deploying. Message history is stored locally in
`data/messages.json`; it is excluded from version control.

## Troubleshooting

- **The dashboard says “Not configured”:** Check that `.env` is in the project
  root, both `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are
  non-empty, and the server was restarted after editing.
- **Meta says the access token is invalid or expired:** Generate a new token
  and replace `WHATSAPP_ACCESS_TOKEN`. Temporary tokens expire; for ongoing
  use, configure a system-user token.
- **The message recipient is not allowed / cannot receive messages:** In test
  mode, add and verify the recipient in Meta API Setup. For a real sender,
  check WhatsApp account status, recipient opt-in, and applicable messaging
  policies.
- **A non-template message is rejected outside the customer-service window:**
  Ask the recipient to message the business first, or use an approved template
  through an implementation that supports templates.
- **The server cannot start because the port is in use:** Change `PORT` in
  `.env` to an unused port, then restart it.

See Meta's [WhatsApp Cloud API documentation](https://developers.facebook.com/documentation/business-messaging/whatsapp/)
for account, permission, policy, and API details.
