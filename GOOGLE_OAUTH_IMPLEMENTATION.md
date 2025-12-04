# Google OAuth Implementation Guide for Momentum Web

## ✅ Completed Components

### 1. GoogleSignInButton Component
**Location:** `app/components/auth/GoogleSignInButton.tsx`

A reusable component that integrates Google Identity Services for OAuth authentication.

**Features:**
- Loads Google Identity Services script dynamically
- Renders official Google Sign-In button
- Handles credential callback
- Configurable button text and styling
- Error handling for missing configuration

### 2. BFF Route for Google Authentication
**Location:** `app/web-bff/auth/google/route.ts`

Backend-for-Frontend route that proxies Google OAuth requests to the main API.

**Endpoint:** `POST /web-bff/auth/google`
**Request Body:** `{ credential: string }` (Google ID token)
**Response:** `{ token: string, user: object }` (Momentum JWT + user data)

## 📋 Remaining Implementation Steps

### Step 1: Add Environment Variable

Add to `.env.local`:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here
```

**To get your Google Client ID:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. Authorized JavaScript origins: `http://localhost:3000` (and your production URL)
7. Copy the Client ID

### Step 2: Update LoginForm.tsx

Add the import:
```typescript
import GoogleSignInButton from './GoogleSignInButton';
```

Add the Google Sign-In handler (after `handleInputChange`):
```typescript
const handleGoogleSignIn = async (credential: string) => {
    setError(null);
    setIsLoading(true);

    try {
        const response = await fetch('/web-bff/auth/google', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ credential }),
        });

        const data = await response.json();

        if (!response.ok || data.status === 'fail' || data.status === 'error') {
            const message = data.message || 'Google sign-in failed.';
            setError(message);
            setIsLoading(false);
            return;
        }

        if (data.token) {
            localStorage.setItem('momentum_token', data.token);
            window.dispatchEvent(new Event('momentum_login'));
        }

        setSuccess(true);

        setTimeout(() => {
            router.push('/family');
        }, 1500);

    } catch (err) {
        console.error('Google sign-in error:', err);
        setError('Failed to sign in with Google. Please try again.');
        setIsLoading(false);
    }
};
```

Add the button to the JSX (after the `</form>` closing tag, before the "Don't have an account?" link):
```tsx
{/* Divider */}
<div className="relative my-6">
    <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border-subtle"></div>
    </div>
    <div className="relative flex justify-center text-sm">
        <span className="px-2 bg-bg-surface text-text-secondary">Or continue with</span>
    </div>
</div>

{/* Google Sign-In */}
<GoogleSignInButton 
    onSuccess={handleGoogleSignIn}
    onError={() => setError('Google sign-in was cancelled or failed.')}
    text="signin_with"
/>
```

### Step 3: Update SignUpForm.tsx

Add the same import and handler as LoginForm.

Add the button to the JSX (after the `</form>` closing tag, before the "Already have an account?" link):
```tsx
{/* Divider */}
<div className="relative my-6">
    <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border-subtle"></div>
    </div>
    <div className="relative flex justify-center text-sm">
        <span className="px-2 bg-bg-surface text-text-secondary">Or continue with</span>
    </div>
</div>

{/* Google Sign-In */}
<GoogleSignInButton 
    onSuccess={handleGoogleSignIn}
    onError={() => setError('Google sign-in was cancelled or failed.')}
    text="signup_with"
/>
```

### Step 4: Backend API Support

**Verify the backend has the Google OAuth endpoint:**

The backend should have an endpoint at `/auth/google` that:
1. Accepts `{ idToken: string }` in the request body
2. Verifies the Google ID token
3. Creates or finds the user account
4. Returns a Momentum JWT token

**Example backend implementation (if needed):**
```typescript
// In momentum-api/src/controllers/authController.ts
async googleAuth(req: Request, res: Response) {
    const { idToken } = req.body;
    
    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { email, given_name, family_name, picture } = payload;
    
    // Find or create user
    let user = await User.findOne({ email });
    
    if (!user) {
        // Create new user from Google account
        user = await User.create({
            email,
            firstName: given_name,
            lastName: family_name,
            profilePicture: picture,
            authProvider: 'google'
        });
        
        // Create default household
        const household = await Household.create({
            name: `${given_name}'s Family`,
            createdBy: user._id
        });
        
        user.householdId = household._id;
        await user.save();
    }
    
    // Generate JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    
    res.json({
        status: 'success',
        token,
        data: { user }
    });
}
```

## 🧪 Testing

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to login page:**
   `http://localhost:3000/login`

3. **Click the Google Sign-In button**

4. **Verify:**
   - Google account picker appears
   - After selection, redirects to `/family`
   - Token is stored in localStorage
   - User is authenticated

## 🔒 Security Notes

- **Never commit** `.env.local` to version control
- Use different Google Client IDs for development and production
- The Google ID token is verified server-side (in the backend API)
- JWT tokens should have expiration times
- Consider implementing refresh tokens for long-term sessions

## 📚 Additional Resources

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

## ✨ Current Status

**Completed:**
- ✅ GoogleSignInButton component
- ✅ BFF route for Google authentication
- ✅ Integration into LoginForm (code ready, needs manual addition)

**Pending:**
- ⏳ Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to environment
- ⏳ Manually add Google Sign-In button to LoginForm.tsx
- ⏳ Manually add Google Sign-In button to SignUpForm.tsx
- ⏳ Verify backend `/auth/google` endpoint exists and works

Once these steps are completed, users will be able to sign in with Google on the web app!
