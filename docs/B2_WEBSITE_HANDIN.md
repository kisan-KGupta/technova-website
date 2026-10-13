# TechNova Solutions — B2 Website Hand-In Documentation
**Module:** University of Sunderland — CET257 Enterprise Project  
**Assessment:** Assessment 2, Task B2  
**Featured Project:** Two Pairs of Eyes (Browser-Based 3D Warehouse Safety Simulator)  
**Date:** October 2026  

---

## 1. Executive Summary & B2 Alignment

This static promotional website represents the enterprise web presence for **TechNova**, a student enterprise team developed for Assessment 2, Task B2 of the CET257 Enterprise Project. The website promotes our core interactive product, **Two Pairs of Eyes**, an interactive, browser-native 3D warehouse safety simulation designed to train personnel to overcome authority bias and make critical workplace safety decisions.

The website strictly maintains the established TechNova corporate design system (dark green, moss green, beige typography, and dark/light mode toggle) while delivering a responsive promotional platform.

---

## 2. Website Structure & B2 Requirements Covered

| Section | Target Anchor / ID | B2 Assessment Requirement Satisfied | Description & Implementation |
|---|---|---|---|
| **Header & Brand Navigation** | `#navbar` | Corporate Identity & Navigation | TechNova vector logo (adaptive dark/light SVG), intuitive anchor links to all core sections, and one-click Dark/Light mode switcher. |
| **Hero Section & 3D WebGL Stream** | `#hero` / `#canvas-container` | Innovation & High-Tech Core | Value proposition, live Three.js 60fps WebGL interactive warehouse preview with 360° orbit controls and environment presets (Storage Bay, Hazard Zone, Staging Hub), and "Watch Project Video" primary CTA. |
| **B2B Services** | `#services` | TechNova Solutions Catalog | Custom 3D WebGL simulation, behavioral/authority bias modeling, and telemetry analytics (distinguishing working prototype from planned SCORM/xAPI enterprise export schemas). |
| **Promotional Video Showcase** | `#project-video` | Task B2 Video Integration | Prominently positioned HTML5 16:9 video player featuring the combined high-definition promotional walkthrough (`assets/videos/two-pairs-of-eyes-promo.mp4`), poster frame, scene jump navigation, and 4 learning pillars. |
| **Featured Case Study** | `#case-study` | Portfolio & Product Mechanics | In-depth breakdown of the "Two Pairs of Eyes" project, client problem statement (authority deference with Supervisor Dave), solution mechanics, and interactive Cognitive Decision HUD prototype. |
| **Evolution Matrix** | `#technology` | Market Differentiation | Comparative evaluation contrasting passive slide LMS and heavy VR headsets against TechNova's zero-install 3D WebGL architecture. |
| **About TechNova** | `#about` | Company Mission & Values | Transparent student enterprise mission, core value pillars (zero hardware barriers, behavioral fidelity, academic integrity under CET257). |
| **Leadership Team** | `#team` | Genuine Team Responsibilities | Profiles and designated responsibilities for all 4 team members: Rachana Paudel (Project Director), Kisan K. Gupta (Lead Systems Developer), Rupesh Bashyal (UI/UX & 3D Spatial), and Anupa Neupane (HCI Researcher & Content Lead). |
| **Academic Consultation / Contact** | `#contact` | Practical Contact Channel | Direct email-based consultation draft generator with client parameters, clipboard copy utility, and institutional contact routing. |
| **Footer & Disclaimers** | `.site-footer` | Standards & Compliance | Academic hand-in metadata, session privacy statements, and accessible section links replacing dead placeholder anchors. |

---

## 3. Promotional Video Details & Location

- **File Path:** `assets/videos/two-pairs-of-eyes-promo.mp4`
- **Poster Frame:** `assets/images/promo-poster.jpg`
- **Source Material:** Merged from the two high-definition project recordings (`Creating_promotional_video_from_…_20261013000632.mp4` and `Promotional_video_for_game_1080p_20261013215134.mp4`).
- **Technical Video Specifications:**
  - Container: MP4 (H.264 / AAC)
  - Resolution: 1920 × 1080 (16:9 Full HD)
  - Frame Rate: 24.0 fps
  - Audio: Stereo AAC, 48 kHz
  - Optimization: Web-optimized with `+faststart` moov atom header for instant streaming playback
  - Preload: `preload="metadata"` to prevent unnecessary background bandwidth usage
  - Mobile: Full `playsinline` compatibility
  - Accessibility: Full keyboard control support, `aria-label`, visible fallback link, and programmatic error recovery overlay.
- **Scene Timestamps:**
  - `0:00` — High-Bay Warehouse Aisle Inspection Patrol
  - `0:10` — Supervisor Dave Confrontation & Oil Spill Decision HUD

---

## 4. Instructions to Run the Website Locally

The website is engineered entirely as a lightweight, static web application requiring no compilation step, Node.js runtime, or framework dependencies.

### Option A: Direct Browser Launch
Open `index.html` directly in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari).

### Option B: Local Development Server (Recommended for WebGL/Asset loading)
Using Python (built into most environments):
```bash
# From the project root (c:\Users\admin\Documents\technova-website)
python -m http.server 8000
```
Then navigate to: `http://localhost:8000/index.html`

Or using Node.js `npx`:
```bash
npx serve .
```

To view the horizontal comparative Dark/Light studio:
Open `prototype-studio.html` or navigate to `http://localhost:8000/prototype-studio.html`.

---

## 5. Required Deployment Configuration

Before final live hosting deployment to an institutional or public web host (e.g., GitHub Pages, Netlify, or University server), the following configuration items must be finalized:

1. **Verified Team Email Address:**  
   Update `student-team@sunderland.ac.uk` in `app.js` (line 551) and `index.html` (line 672) to the team's official verified module submission mailbox.
2. **Production Asset Paths:**  
   Confirm that server MIME types correctly serve `.mp4` as `video/mp4` and `.svg` as `image/svg+xml`.
3. **Verified Live Website URL:**  
   *(To be recorded by the team upon hosting upload)*  
   `[ PENDING DEPLOYMENT — Insert Live URL here, e.g., https://technova-cet257.github.io ]`

---

## 6. Summary of Key Modifications & B2 Corrections

1. **Promotional Video Integration:**
   - Seamlessly concatenated both source video clips into one cohesive 20-second walkthrough MP4 at `assets/videos/two-pairs-of-eyes-promo.mp4`.
   - Extracted a crisp 1080p poster frame from the genuine video at `assets/images/promo-poster.jpg`.
   - Implemented a responsive 16:9 presentation player with top window bar, HD badge, native controls, quick scene jump buttons, and a fallback download overlay.
2. **Homepage Hero Video CTA:**
   - Integrated secondary action button **Watch Project Video** in the hero CTA row, smoothly scrolling directly to `#project-video`.
   - Refined hero actions into a balanced 2-button layout ("Explore Case Study" and "Watch Project Video") with a secondary consultation link prompt, eliminating awkward wrapping.
   - Added `Promo Video` to the primary navigation bar.
3. **Scroll-Triggered Autoplay & Audio Controls:**
   - Implemented an `IntersectionObserver` in `app.js` that automatically starts video playback (muted) as the user scrolls into `#project-video` and pauses when scrolled out.
   - Added a topbar audio toggle button (`#btn-toggle-audio`) for one-click unmuting/muting.
4. **Enhanced Featured Project Section Components:**
   - Added a 4-metric **Project Architecture Specifications Strip** (`.project-spec-strip`): Simulation Engine, Scenario Environment, Cognitive Focus, and Audit Framework.
   - Added a 3-column **Featured Simulation Highlights Grid** (`.project-highlights-grid`): Dynamic Supervisor NPC AI, Instanced Spatial Warehouse, and Real-Time Assertiveness Scoring.
   - Replaced all consumer emojis with custom SVG vector icons across the entire website (learning pillars, alert badges, comparison matrix, decision HUD, and contact perks).
5. **Correction of Misleading Marketing Claims:**
   - Removed unverified commercial claims (e.g. fictitious "94% Trainee Protocol Retention", "ISO 27001 Certified Architecture", "ISO 45001 Aligned", and "TechNova Solutions Ltd. registered company").
   - Restructured claims to accurately present TechNova as an academic student enterprise team developed for University of Sunderland CET257 Assessment 2.
   - Accurately distinguished implemented prototype capabilities (real-time 3D WebGL rendering, in-browser assertion telemetry) from proposed future enterprise services (modular SCORM/xAPI LMS integration).
6. **Correction of Contact Form Submission:**
   - Removed the simulated fake success timeout ("consultation logged in 24 hours").
   - Implemented a functional email-based contact dispatch using standard `mailto:` encoding with client inputs.
   - Added an on-page enquiry summary preview and an instant "Copy Enquiry to Clipboard" utility.
   - Added an explicit academic disclaimer highlighting that institutional recipient email configuration is required.
7. **Marketing Message Alignment:**
   - Featured the primary promotional slogan: **Two Pairs of Eyes — Fresh Eyes. Safer Choices.**
   - Outlined the 4 core learning outcomes: (1) Identify workplace hazards, (2) Evaluate supervisor advice critically, (3) Make safety decisions, and (4) Observe consequences and learn from choices.

---

## 7. Outstanding B2 Requirements & Unresolved Items

1. **Zero-Budget Marketing Plan:**  
   *Status: Outstanding B2 Requirement.*  
   The team does not currently have a completed zero-budget marketing plan document committed in this repository. In accordance with B2 assessment guidance, this must be finalized by the student team as part of the overall Task B2 submission dossier.
2. **Live Hosting URL:**  
   *Status: Awaiting Deployment.*  
   The website is ready to deploy statically. Once deployed, the verified live URL must be entered in Section 5 above and on the assessment cover sheet.
