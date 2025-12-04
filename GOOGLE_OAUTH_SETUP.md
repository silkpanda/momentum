# Quick Setup: Extract Google Client ID from OAuth Credentials

Since you already have the OAuth credentials JSON files in the `.gemini` folder, follow these steps to extract and configure the Client ID:

## Step 1: Locate Your OAuth Credentials Files

You mentioned you have two files:
- One for mobile
- One for web app

These are typically named something like:
- `client_secret_XXXXX.apps.googleusercontent.com.json` (Web)
- `google-services.json` or similar (Mobile)

## Step 2: Extract the Web Client ID

Open the **web app** OAuth credentials JSON file. It should look like this:

```json
{
  "web": {
    "client_id": "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com",
    "project_id": "your-project",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "YOUR_CLIENT_SECRET",
    "redirect_uris": ["http://localhost:3000"]
  }
}
```

Copy the value of `client_id` (the long string ending in `.apps.googleusercontent.com`).

## Step 3: Create `.env.local` File

In the `momentum-web` directory, create a file named `.env.local`:

```bash
# In momentum-web directory
NEXT_PUBLIC_GOOGLE_CLIENT_ID=paste-your-client-id-here.apps.googleusercontent.com
```

**Important:** Replace `paste-your-client-id-here.apps.googleusercontent.com` with the actual Client ID from your JSON file.

## Step 4: Restart the Dev Server

After creating `.env.local`, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Step 5: Test Google Sign-In

Once the server restarts with the environment variable:

1. Navigate to `http://localhost:3000/login`
2. You should see the Google Sign-In button below the email/password form
3. Click it to test the OAuth flow

## Alternative: Manual Entry

If you can't find the JSON files, you can get the Client ID from Google Cloud Console:

1. Go to https://console.cloud.google.com/
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Find your **OAuth 2.0 Client ID** for Web application
5. Copy the Client ID
6. Add it to `.env.local` as shown above

## Verification

To verify the environment variable is loaded:

1. Add this temporary code to any page component:
```typescript
console.log('Google Client ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
```

2. Check the browser console - you should see your Client ID printed

3. Remove the console.log after verification

## Security Note

**Never commit `.env.local` to git!** It's already in `.gitignore` by default in Next.js projects.

---

Once you've completed these steps, the Google Sign-In button will be fully functional!
