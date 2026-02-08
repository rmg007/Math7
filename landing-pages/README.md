# Questerix Landing Pages

The marketing, SEO, and content hub frontend for the Questerix education platform.
Built with **React**, **Vite**, and **Tailwind CSS v4**.

## 🚀 Features

### Core Pages
- **Home** (`/`) - Hero, curriculum showcase, blog section
- **About** (`/about`) - Company mission, story, and values
- **How It Works** (`/how-it-works`) - 3-step learning methodology
- **Blog** (`/blog`) - Resource center with educational articles
- **Blog Posts** (`/blog/:slug`) - Individual article pages

### Download Pages
- **iOS** (`/download/ios`) - App Store download page
- **Android** (`/download/android`) - Play Store download page

### Legal Pages
- **Privacy Policy** (`/privacy`)
- **Terms of Service** (`/terms`)
- **Cookie Policy** (`/cookies`)

### Design Features
- **High-Fidelity Design**: Glassmorphism headers, gradients, and noise textures
- **Mobile-First**: Fully responsive with smooth hamburger drawer navigation
- **Dynamic Routing**: Subject hubs via subdomain (`/?subdomain=math`)
- **SEO Optimized**: Semantic HTML, ARIA labels, alt text, footer sitemap

## 🛠 Tech Stack
- **Framework**: React 18 + Vite
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS v4 (using `@theme` and native CSS variables)
- **Icons**: Lucide React
- **Backend**: Supabase (for subject/app data)
- **Deployment**: Ready for Cloudflare Pages (SPA mode)

## 📁 Project Structure

```
landing-pages/
├── src/
│   ├── components/
│   │   ├── Header.tsx        # Responsive nav with mobile drawer
│   │   ├── Footer.tsx        # Sitemap footer with curriculum links
│   │   └── BlogSection.tsx   # Homepage blog widget
│   ├── pages/
│   │   ├── RootPage.tsx      # Homepage with expanded curriculum
│   │   ├── AboutPage.tsx     # Company information
│   │   ├── HowItWorksPage.tsx
│   │   ├── BlogPage.tsx      # Blog index with categories
│   │   ├── BlogPostPage.tsx  # Individual article template
│   │   ├── DownloadIOSPage.tsx
│   │   ├── DownloadAndroidPage.tsx
│   │   ├── PrivacyPage.tsx
│   │   ├── TermsPage.tsx
│   │   ├── CookiesPage.tsx
│   │   ├── SubjectHubPage.tsx  # Dynamic subject pages
│   │   └── GradeLandingPage.tsx
│   ├── lib/
│   │   ├── supabase.ts       # Supabase client
│   │   └── database.types.ts # TypeScript types
│   └── App.tsx               # Main router configuration
├── public/
├── index.html
└── package.json
```

## 🏃‍♂️ Running Locally

This app is designed to work alongside the Student App.

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Landing Page
```bash
# Run the dev server (Port 5175 is recommended)
npm run dev -- --port 5175 --host 127.0.0.1
```
Access at: `http://127.0.0.1:5175`

### 3. Start the Student App (Required for Login Links)
The "Get Started" and "Log in" buttons redirect to `localhost:3000`.
You must have the Student App running on this port.

```bash
cd ../student-app
flutter run -d web-server --web-port=3000 --web-hostname=127.0.0.1
```

## 🔗 Available Routes

| Route | Description |
|-------|-------------|
| `/` | Homepage with hero, subjects, blog |
| `/about` | About Questerix |
| `/how-it-works` | Learning methodology |
| `/blog` | Blog index |
| `/blog/:slug` | Individual blog post |
| `/download/ios` | iOS app download |
| `/download/android` | Android app download |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/cookies` | Cookie policy |
| `/?subdomain=math` | Subject hub (dev mode) |

## 🔍 SEO Features

- **Semantic HTML**: Proper heading hierarchy (h1 → h2 → h3)
- **ARIA Labels**: Accessibility attributes on all interactive elements
- **Alt Text**: Descriptive alt text for images and icons
- **Footer Sitemap**: Curriculum directory for link equity distribution
- **Expanded Content**: 100-150 word descriptions per curriculum subject
- **Standards Alignment**: Common Core, NGSS, IB framework references

## 📱 Mobile Verification
1. Open Chrome DevTools (`F12`)
2. Toggle Device Toolbar (`Ctrl+Shift+M`)
3. Select "iPhone 12 Pro" or set width to `390px`
4. Verify the Hamburger Menu and stacked Hero buttons

## 🚀 Building for Production

```bash
npm run build
```

Output will be in the `dist/` folder, ready for deployment.

## 📝 Blog Content Management

Currently, blog content is stored as static data in:
- `src/components/BlogSection.tsx` - Homepage preview cards
- `src/pages/BlogPage.tsx` - Full article list
- `src/pages/BlogPostPage.tsx` - Article content

Future enhancement: Integrate with a headless CMS (Notion, Contentful, or Supabase).
