# Fluentia — German Language Teaching Website

A modern Next.js 15 + TypeScript multilingual website for German language instruction, featuring:
- **Three languages**: Persian, German, English  
- **CMS functionality**: Blog posts, classes, admin panel  
- **Vercel Blob integration**: Dynamic content storage  
- **Responsive design**: Mobile-first with dark/light themes  
- **Admin dashboard**: Content management system  

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment template and set your admin credentials  
cp .env.local.example .env.local
# Edit .env.local with your ADMIN_EMAIL and ADMIN_PASSWORD

# Start development server
npm run dev
# Opens on http://localhost:9002

# Build for production
npm run build

# Type checking
npm run typecheck
```

## 🌐 Deploy to Vercel (Free)

1. **Push to GitHub**: Create a repo and push this code
2. **Connect to Vercel**: Import project from your GitHub repo  
3. **Set Environment Variables** in Vercel dashboard:
   ```
   ADMIN_EMAIL=your@email.com
   ADMIN_PASSWORD=your-secure-password  
   BLOB_READ_WRITE_TOKEN=your-vercel-blob-token (optional)
   ```
4. **Deploy**: Vercel auto-deploys on git push

## 🔧 Key Features

- **Admin Login**: `/login` → Use credentials from env vars
- **Admin Dashboard**: `/admin` → Manage content, posts, classes  
- **Multi-language**: Auto-detects and switches between fa/de/en
- **Blog System**: Dynamic posts with categories  
- **Class Management**: Course listings with registration forms  
- **Analytics**: Basic page view tracking  

## 📁 Project Structure

```
src/
├── app/                 # Next.js 15 App Router
├── components/          # Reusable UI components  
├── lib/                 # Data fetching & utilities
│   ├── cms-store.ts     # Vercel Blob integration
│   ├── empty-data.ts    # Fallback content
│   └── types.ts         # TypeScript definitions
└── context/             # React contexts (auth, language)
```

## 🔒 Admin Access

Default credentials (change in production):
- **Email**: `admin@example.com`  
- **Password**: `password`

For production, set secure credentials via Vercel environment variables.

## 🎯 Vercel Blob Setup (Optional)

If you want persistent content storage:
1. Create Vercel Blob storage in your Vercel dashboard
2. Copy the `BLOB_READ_WRITE_TOKEN` 
3. Add it to your environment variables
4. Content will be saved/loaded from Vercel Blob instead of fallback data

Without Blob token, the site uses static content from `src/lib/empty-data.ts`.

---

**Live Demo**: Deploy to see it in action!  
**Next.js**: 15.3.3 | **TypeScript** | **Tailwind CSS** | **Vercel Blob**
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.
