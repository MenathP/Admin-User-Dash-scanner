# Admin User Dash Scanner

A Next.js 15 dashboard scaffold for admin/user pages with auth and interactive components.

## Quick start

Prerequisites
- Node.js 18+ (Node 20 recommended)
- pnpm (recommended) or npm

Install dependencies

Using pnpm (preferred):

```bash
pnpm install
```

Using npm:

```bash
npm install
```

Run development server

```bash
pnpm dev
# or
npm run dev
```

Build for production

```bash
pnpm build
pnpm start
# or
npm run build
npm start
```

Environment

This repository includes API routes under `app/api` which may depend on environment variables (for example, JWT secrets, database URLs, etc.). There is no app-wide `.env` file committed. Create a `.env.local` in the project root if you need to add secrets. Common variables you may need to set:

- `DATABASE_URL` - connection string for your database (if used)
- `JWT_SECRET` - secret used for signing tokens
- Any other variables referenced by your API routes or server code

Project structure

- `app/` - Next.js app router pages and API routes
- `components/` - shared React components and UI primitives
- `public/` - static assets
- `hooks/`, `lib/` - utility hooks and helper functions

Notes

- The project includes both `pnpm-lock.yaml` and `package-lock.json`. Use the package manager you prefer; `pnpm` is recommended for faster installs and disk space efficiency.
- This README was added and pushed to the repository on branch `main`.

Contributing

If you make changes, please run the dev server and add tests where appropriate.

License

This project doesn't include a license file. Add a `LICENSE` if you intend to make it public under a specific license.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
