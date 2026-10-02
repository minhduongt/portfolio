# Navigation and section motion

The shared navbar stays visible during scroll and gains a translucent background, blur and soft border after 24px. Desktop links animate an underline on hover, focus and active location. Resume and primary actions have subtle arrow feedback.

At widths up to 900px, navigation expands into a vertical panel with staggered link entrances. The orbital menu icon transforms into a close icon. Selecting a link, clicking outside or pressing Escape closes the panel; Escape returns focus to the menu button. Closed mobile links are inert. Resizing across the breakpoint resets the panel, and desktop links remain accessible.

The portfolio hero enters in sequence. Headings, about content, individual project cards, experience rows and contact content reveal once when they enter the viewport. The existing Three.js layer scroll animation remains independent. Reveals use opacity and translation, without new dependencies. Content stays visible if IntersectionObserver is unavailable, and focusing an element reveals its containing card. Reduced-motion preferences disable entrances, smooth scrolling and navigation transitions.

Checks:

```powershell
npm.cmd run build:firebase
npm.cmd run preview -- --host 127.0.0.1 --port 4177 --base /
# In a second terminal:
node scripts/check-navigation-motion.mjs
node scripts/check-entry-loading.mjs
node scripts/check-hosting.mjs
```

Browser checks cover desktop feedback, sticky navigation, section reveals, widths 320/390/700/859/1024/1440, mobile dismissal and focus, resizing, reduced motion and login navigation. These changes have not been deployed to Firebase.
