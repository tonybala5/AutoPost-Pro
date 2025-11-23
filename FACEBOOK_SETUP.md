# Facebook Integration Setup Guide

To use the **AutoPost Pro** with real functionality, you need a valid **Facebook Access Token** with specific permissions. Because Facebook restricts automated posting to prevent spam, you must create a personal "App" in the Facebook Developers portal to generate this token for yourself.

Follow these steps strictly to obtain a working token.

---

## Prerequisites
*   A Facebook Account.
*   You must be an **Admin** of the Groups you want to post to (or the Group must allow API posting).

---

## Step 1: Create a Facebook App
You need a container "App" to hold your permissions.

1.  Go to [developers.facebook.com](https://developers.facebook.com/).
2.  Log in with your Facebook account.
3.  Click **"My Apps"** (top right) -> **"Create App"**.
4.  Select **"Consumer"** (or "Other" > "Consumer") as the app type. Click **Next**.
5.  **Display Name**: Enter any name (e.g., "MyAutoPoster").
6.  **Contact Email**: Ensure your email is correct.
7.  Click **Create App**. You may need to enter your Facebook password.

---

## Step 2: Open the Graph API Explorer
This is the official tool to generate tokens.

1.  In the Facebook Developers dashboard, go to **Tools** -> **[Graph API Explorer](https://developers.facebook.com/tools/explorer/)**.
2.  **Meta App**: In the dropdown menu on the right, select the App you just created in Step 1 (e.g., "MyAutoPoster").
3.  **User or Page**: Select **"User Token"**.

---

## Step 3: Add Permissions (Crucial)
You must explicitly tell Facebook what this token is allowed to do.

1.  Locate the **"Permissions"** section in the right sidebar.
2.  Click the dropdown or search box and add the following **two permissions**:
    *   `publish_to_groups` (Allows posting content)
    *   `groups_access_member_info` (Allows reading your group list)
    *   *(Optional)* `public_profile` (Usually added by default, required for your name/avatar).

3.  The list should look like this:
    *   `email`
    *   `public_profile`
    *   `publish_to_groups`
    *   `groups_access_member_info`

---

## Step 4: Generate the Token
1.  Click the blue **"Generate Access Token"** button.
2.  A popup window will appear asking you to "Continue as [Your Name]". Click **Continue**.
3.  **Important:** The next screen might ask "Choose what you allow". **Do not uncheck anything.** Ensure all groups/pages are selected or leave as default.
4.  Click **Save/Continue**.
5.  The popup will close.

---

## Step 5: Copy and Use
1.  Back in the Graph API Explorer, look at the **Access Token** field at the top.
2.  Click the **"i" (Info)** icon next to the token to verify the scopes/permissions are listed.
3.  Click **Copy**.
4.  Go to **AutoPost Pro**, select **"Token Manual"** (Manual Token), paste the code, and click **Validar**.

---

## Common Issues & Troubleshooting

### "Token Expired"
Tokens generated this way (Short-Lived) usually last **1 hour**.
*   **Fix:** Simply click "Generate Access Token" again in the Graph Explorer to get a new one.

### "Permissions Missing" error in the App
*   **Fix:** Ensure you actually added `publish_to_groups` in Step 3 **AND** clicked "Generate Access Token" afterwards to refresh the permissions.

### "Cannot post to group"
*   **Reason:** Facebook requires Apps to be "Installed" in the Group settings for some groups, or you must be the Admin.
*   **Fix:** Go to your Facebook Group -> Settings -> Apps -> Add Apps -> Search for the App ID/Name you created in Step 1.

### App Mode (Development vs Live)
*   Keep your Facebook App in **Development Mode** (default).
*   In Development mode, you can only post to groups where **you** (the admin of the app) are an admin or member. You cannot post to random public groups you do not own without undergoing a strict "App Review" process by Facebook.
