# Fix Google login (401 invalid_client)

Supabase is currently sending Google this Client ID:

```
Pins.App
```

That is an **app name**, not a Google OAuth client. Google then returns **401: The OAuth client was not found**.

A real Client ID looks like:

```
123456789-abc.apps.googleusercontent.com
```

## 1. Create the Google Cloud client

Open: https://console.cloud.google.com/auth/clients/create

1. Application type: **Web application**
2. Name: `Pins Pets`
3. **Authorized JavaScript origins**
   - `http://127.0.0.1:5174`
   - `http://localhost:5174`
4. **Authorized redirect URIs** (this must be exact)
   - `https://ucijobfqdwkqhdqdffno.supabase.co/auth/v1/callback`
5. Create → copy **Client ID** and **Client Secret**

If Google asks you to configure a consent screen first: User type **External**, app name **Pins Pets**, then add yourself as a test user.

## 2. Paste it into Supabase (this is the actual 401 fix)

Open: https://supabase.com/dashboard/project/ucijobfqdwkqhdqdffno/auth/providers

1. Expand **Google**
2. Enable it
3. **Replace** Client ID (`Pins.App`) with the Google Cloud Client ID
4. Paste Client Secret
5. Save

## 3. Allow the app to return after Google

Open: https://supabase.com/dashboard/project/ucijobfqdwkqhdqdffno/auth/url-configuration

- Site URL: `http://127.0.0.1:5174`
- Redirect URLs, add:
  - `http://127.0.0.1:5174/auth/callback`
  - `http://localhost:5174/auth/callback`

Then try **Continue with Google** again on http://127.0.0.1:5174/
