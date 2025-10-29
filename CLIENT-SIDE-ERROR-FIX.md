# 🔧 Client-Side Application Error Fix

**Error:** "Application error: a client-side exception has occurred"  
**Root Cause:** Old JWT tokens/cookies from previous sessions causing verification failures  
**Status:** ✅ **FIXABLE - Browser cookies need to be cleared**

---

## 🎯 Root Cause Analysis

### **Error in Logs:**
```
❌ JWT verification failed: Error [JsonWebTokenError]: invalid signature
    at w (.next/server/app/api/auth/custom-session/route.js:1:1419)
```

### **Why This Happens:**
1. Browser has **old JWT tokens** from previous sessions
2. These tokens were signed with a **different NEXTAUTH_SECRET**
3. Current backend tries to verify them → **signature mismatch**
4. This causes the frontend to crash with a client-side exception

---

## ✅ SOLUTION: Clear Browser Cookies

### **Method 1: Clear Cookies for localhost (Recommended)**

#### **Google Chrome:**
1. Open DevTools: `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
2. Go to **Application** tab
3. Expand **Cookies** in left sidebar
4. Click on **`http://localhost:3000`**
5. Right-click → **Clear** or select all and press Delete
6. **Refresh the page** (`F5` or `Cmd+R`)

#### **Firefox:**
1. Open DevTools: `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
2. Go to **Storage** tab
3. Expand **Cookies**
4. Click on **`http://localhost:3000`**
5. Right-click → **Delete All**
6. **Refresh the page** (`F5` or `Cmd+R`)

#### **Safari:**
1. Open Web Inspector: `Cmd+Option+I`
2. Go to **Storage** tab
3. Click on **Cookies**
4. Select **`http://localhost:3000`**
5. Delete all cookies
6. **Refresh the page** (`Cmd+R`)

#### **Edge:**
1. Open DevTools: `F12` or `Ctrl+Shift+I`
2. Go to **Application** tab
3. Expand **Cookies**
4. Click on **`http://localhost:3000`**
5. Right-click → **Clear** all cookies
6. **Refresh the page** (`F5`)

---

### **Method 2: Use Incognito/Private Browsing (Quick Test)**

1. Open a **new Incognito/Private window**:
   - Chrome: `Cmd+Shift+N` (Mac) / `Ctrl+Shift+N` (Windows)
   - Firefox: `Cmd+Shift+P` (Mac) / `Ctrl+Shift+P` (Windows)
   - Safari: `Cmd+Shift+N`
   - Edge: `Ctrl+Shift+N`

2. Navigate to: `http://localhost:3000/`

3. This starts with a **clean slate** (no old cookies)

---

### **Method 3: Clear All Browser Data (Nuclear Option)**

⚠️ **Warning:** This clears ALL cookies, not just localhost

#### **Chrome/Edge:**
1. Open Settings → Privacy and Security
2. Click **Clear browsing data**
3. Select **Cookies and other site data**
4. Click **Clear data**

#### **Firefox:**
1. Open Settings → Privacy & Security
2. Scroll to **Cookies and Site Data**
3. Click **Clear Data**

#### **Safari:**
1. Safari Menu → Preferences → Privacy
2. Click **Manage Website Data**
3. Click **Remove All**

---

## 🔍 Verification Steps

After clearing cookies:

1. **Refresh the page**: `F5` or `Cmd+R`
2. **Check if error is gone**: Page should load without application error
3. **Sign in fresh**: Use the correct credentials
   ```
   Email: admin@trendlama.com
   Password: password123
   ```
4. **Verify session works**: You should see your username in the navbar

---

## 🛡️ Prevention for Future

### **Why JWT Tokens Become Invalid:**

1. **NEXTAUTH_SECRET changed** during deployment
2. **Old pods** with different secrets still running
3. **Browser cached** the old token
4. **New backend** can't verify old signatures

### **Best Practice:**

1. **Always use Incognito mode** during development/testing
2. **Clear cookies** after each redeployment
3. **Use consistent NEXTAUTH_SECRET** across all deployments
4. **Set shorter JWT expiry** during development (e.g., 1 hour)

---

## 🧪 Alternative: API-Based Cookie Clearing

If you prefer, you can also clear cookies programmatically:

### **In Browser Console (F12):**
```javascript
// Clear all cookies for localhost
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "")
    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});

// Then refresh
window.location.reload();
```

---

## 📊 Technical Details

### **JWT Cookie Names Used:**
- `next-auth.session-token` (Production)
- `__Secure-next-auth.session-token` (HTTPS)
- `next-auth.csrf-token`
- Custom session cookies

### **Why Old Tokens Fail:**
```javascript
// Old token signed with:
OLD_SECRET = "different-secret-key"

// Current backend expects:
NEW_SECRET = "ST3BArqqKQIo4m5XZnHZNTcz2wQAF3Du8r78gVf7Hw="

// Result: Signature mismatch → verification fails
```

---

## ✅ Expected Behavior After Fix

### **Before (With Old Cookies):**
```
❌ Application error: a client-side exception has occurred
❌ JWT verification failed: invalid signature
❌ Page crashes/shows error
```

### **After (Cookies Cleared):**
```
✅ Website loads successfully
✅ No application errors
✅ Can sign in with credentials
✅ Session persists correctly
✅ Navbar shows user info
```

---

## 🎯 Quick Fix Summary

**Fastest Solution:**
1. Open **Incognito/Private window**
2. Go to `http://localhost:3000/auth/signin/`
3. Sign in with `admin@trendlama.com` / `password123`
4. Website should work perfectly!

**Permanent Solution:**
1. Open **DevTools** (F12)
2. Go to **Application/Storage** tab
3. **Clear all cookies** for localhost
4. **Refresh** the page
5. **Sign in** with fresh credentials

---

## 🆘 If Problem Persists

If clearing cookies doesn't resolve the issue:

1. **Check frontend logs:**
   ```bash
   kubectl logs -n ecommerce-production deployment/ecommerce-frontend-deployment --tail=50
   ```

2. **Verify NEXTAUTH_SECRET is consistent:**
   ```bash
   kubectl get secret ecommerce-secrets -n ecommerce-production -o jsonpath='{.data.nextauth-secret}' | base64 -d
   ```

3. **Restart frontend pods:**
   ```bash
   kubectl rollout restart deployment/ecommerce-frontend-deployment -n ecommerce-production
   ```

4. **Check browser console** for specific error messages (F12 → Console tab)

---

## 📝 Summary

**Problem:** Old JWT tokens causing client-side crashes  
**Solution:** Clear browser cookies for localhost  
**Fastest Fix:** Use Incognito/Private browsing mode  
**Prevention:** Clear cookies after each redeployment  

**Your website is operational - just need to clear the old authentication cookies!** 🚀

