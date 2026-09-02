# PWA and Push Notifications Setup Guide

## Prerequisites

1. **Service Worker**: Already configured at `/public/sw.js`
2. **Manifest**: PWA manifest configured at `/public/manifest.webmanifest`
3. **Database**: Push subscription tables created via migration

## Setup Steps

### 1. Generate VAPID Keys

VAPID keys are needed to send push notifications. Generate them once using:

```bash
# Using web-push (install globally)
npm install -g web-push
web-push generate-vapid-keys

# Or visit: https://tools.reactpwa.com/vapid
```

This will output:
```
Public Key: <base64-encoded-public-key>
Private Key: <base64-encoded-private-key>
```

### 2. Set Environment Variables

Add to your `.env.local` (development) and environment configuration (production):

```env
VITE_VAPID_PUBLIC_KEY=<your-public-key>
VITE_VAPID_PRIVATE_KEY=<your-private-key>
```

**Note**: The private key should ONLY be used on the server side and never exposed to the client.

### 3. Server-Side Setup

To actually send push notifications, you need a backend service. Options:

#### Option A: Use a Service like Firebase Cloud Messaging (FCM)
- Simpler setup
- Handles push delivery for you
- No VAPID key needed (FCM has its own)

#### Option B: Implement Web Push Protocol
- More control
- Requires implementing RFC 8291 (Web Push Protocol)
- Libraries: `web-push` (Node.js), or implement custom for Cloudflare Workers

#### Option C: Use Supabase Edge Functions
- Deploy a server-side function to send notifications
- Call it from your API when a message is received

### 4. Client-Side Setup (Already Done)

The app includes:
- Service worker registration in `__root.tsx`
- Push notification utilities in `src/lib/push-notifications.ts`
- Admin settings page for managing subscriptions at `/admin/notifications`

### 5. Testing Push Notifications

**Locally (without actually sending):**
```javascript
// In browser console
const registration = await navigator.serviceWorker.ready;
registration.showNotification('Test Notification', {
  body: 'This is a test',
  icon: '/logo.svg'
});
```

**On Android:**
1. Install the app as PWA: "Install app" from Chrome menu
2. Enable notifications when prompted
3. Go to `/admin/notifications` and click "Enable"
4. New messages will show notifications (when backend is configured)

### 6. Integration with Message Submission

When a contact message is submitted:

```javascript
// In your message submission endpoint
await sendPushNotificationsToAdmins({
  id: messageId,
  name: senderName,
  email: senderEmail,
  message: messageText,
  mode: 'creator' or 'developer'
});
```

### 7. Deploying to Production

1. Add VAPID keys to your production environment
2. Deploy service worker with your app
3. Ensure HTTPS is enabled (required for PWA and push)
4. Set up backend notification sender:
   - Cloudflare Worker Function
   - Supabase Edge Function
   - Separate Node.js service

### 8. Browser Compatibility

- **Desktop**: Chrome, Firefox, Edge, Safari (15.1+)
- **Mobile**: Android Chrome, Samsung Internet
- **Note**: iOS requires web apps to be installed via "Add to Home Screen", and notifications are limited

### Troubleshooting

**Service Worker not registering:**
- Check console for errors
- Ensure `/public/sw.js` exists
- Verify HTTPS in production

**Push notifications not showing:**
- Check notification permission: Settings > Notifications
- Ensure VAPID keys are configured
- Verify backend is calling notification API correctly
- Check browser DevTools: Application > Service Workers > Push

**Subscriptions not saving:**
- Check Supabase `push_subscriptions` table
- Verify user is authenticated as admin
- Check browser console for errors

## File Structure

```
src/
  ├── lib/
  │   ├── push-notifications.ts      # Client-side utilities
  │   └── server/
  │       └── notifications.server.ts # Server-side (WIP)
  └── routes/
      └── _authenticated/
          └── admin.notifications.tsx # Admin settings UI
public/
  └── sw.js                          # Service Worker
```

## Security Notes

1. Only admins receive push notifications
2. VAPID private key should never be exposed to the client
3. Push subscriptions are tied to user accounts
4. Notifications are only sent for authenticated messages
5. Implement rate limiting on your notification endpoint

## Future Improvements

- [ ] Implement actual Web Push Protocol sender
- [ ] Add notification preferences (sound, frequency)
- [ ] Add notification history/log viewing
- [ ] Support for rich notifications with actions
- [ ] Badge count on home screen
