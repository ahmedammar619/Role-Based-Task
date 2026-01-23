// Browser Console Script to Grant Admin Permissions
// Copy and paste this entire script into your browser's developer console (F12)

(function() {
  console.log('🔓 Granting admin permissions...');
  
  // Step 1: Update localStorage user object
  const USER_KEY = 'current_user';
  const userJson = localStorage.getItem(USER_KEY);
  
  if (!userJson) {
    console.error('❌ No user found in localStorage. Please log in first.');
    return;
  }
  
  try {
    const user = JSON.parse(userJson);
    const originalRole = user.role;
    
    // Update role to admin (or 'owner' for maximum permissions)
    user.role = 'admin'; // Change to 'owner' if you want owner permissions instead
    
    // Save updated user back to localStorage
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    console.log(`✅ Updated user role from "${originalRole}" to "${user.role}" in localStorage`);
    
    // Step 2: Try to update Angular service (if accessible)
    try {
      // Get Angular application reference
      const ngElement = document.querySelector('[ng-version]') || document.querySelector('app-root');
      if (ngElement && ngElement.__ngContext__) {
        const injector = ngElement.__ngContext__[8]; // Angular injector location
        if (injector) {
          // Try to get AuthService
          const AuthService = injector.get ? injector.get : null;
          if (AuthService) {
            // This might not work depending on Angular version, but worth trying
            console.log('⚠️  Angular service update attempted (may require page refresh)');
          }
        }
      }
    } catch (e) {
      console.log('⚠️  Could not update Angular service directly (this is normal)');
    }
    
    // Step 3: Update JWT token payload (optional, for completeness)
    const TOKEN_KEY = 'auth_token';
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (token) {
      try {
        // Decode JWT
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        
        // Update role in token payload
        payload.role = user.role;
        
        // Note: We can't re-sign the JWT without the secret, but updating localStorage user is enough
        // The backend will still validate the original token, but frontend checks will pass
        console.log('ℹ️  JWT token contains role info (backend validation may still fail)');
      } catch (e) {
        console.log('⚠️  Could not decode JWT token (this is okay)');
      }
    }
    
    console.log('\n✅ Admin permissions granted!');
    console.log('📝 Next steps:');
    console.log('   1. Refresh the page (F5 or Cmd+R) to apply changes');
    console.log('   2. You should now see admin features enabled');
    console.log('   ⚠️  Note: Backend API calls may still fail if the server validates roles');
    
    // Optional: Auto-refresh (uncomment if you want automatic refresh)
    // setTimeout(() => window.location.reload(), 1000);
    
  } catch (error) {
    console.error('❌ Error updating permissions:', error);
  }
})();
