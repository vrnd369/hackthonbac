# Astro Starter Kit: Basics

## DataAnalyzer Pro Hackathon 2025 Landing Page

A beautiful, interactive landing page for the DataAnalyzer Pro Hackathon 2025 with integrated registration system.

### Features

- 🎨 Modern, elegant design with glassmorphism effects
- 📱 Fully responsive layout
- 🚀 Interactive animations and micro-interactions
- 📝 Complete registration form with validation
- 🗄️ Supabase integration for data storage
- ✨ Real-time form submission with loading states
- 🎯 Multiple hackathon tracks selection
- 💳 Free and Premium registration options

### Setup Instructions

1. **Install Dependencies**
   ```sh
   npm install
   ```

2. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Update the `.env` file with your credentials:
     ```
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
     SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
     STRIPE_SECRET_KEY=your_stripe_secret_key
     ```

3. **Run Database Migration**
   - In your Supabase dashboard, go to SQL Editor
   - The migrations will be automatically applied when you deploy the edge functions

4. **Set up Stripe (for Premium Registrations)**
   - Create a Stripe account at [stripe.com](https://stripe.com)
   - Get your publishable and secret keys from the dashboard
   - Add them to your environment variables
   - Set up webhooks pointing to your Supabase edge function

5. **Deploy Edge Functions**
   - The edge functions are automatically deployed with your Supabase project
   - Available endpoints:
     - `/functions/v1/create-payment-intent` - Create Stripe payment
     - `/functions/v1/confirm-payment` - Confirm payment completion
     - `/functions/v1/webhook-handler` - Handle Stripe webhooks
     - `/functions/v1/get-registrations` - Admin: Get registration data
     - `/functions/v1/send-welcome-email` - Send welcome emails
     - `/functions/v1/analytics` - Get registration analytics
6. **Start Development Server**
   ```sh
   npm run dev
   ```

### Backend Architecture

The backend consists of several Supabase Edge Functions:

1. **Payment Processing**
   - `create-payment-intent`: Creates Stripe payment intents for premium registrations
   - `confirm-payment`: Confirms successful payments and updates registration status
   - `webhook-handler`: Handles Stripe webhooks for payment status updates

2. **Data Management**
   - `get-registrations`: Admin endpoint to fetch registration data with filtering
   - `analytics`: Provides registration statistics and insights

3. **Communication**
   - `send-welcome-email`: Sends welcome emails to new registrants

### API Endpoints

All endpoints are available at `https://your-project.supabase.co/functions/v1/`

#### Registration Flow
1. User fills out registration form
2. Data is inserted into `hackathon_registrations` table
3. For premium registrations, payment intent is created
4. Payment is processed through Stripe
5. Webhook confirms payment and updates status
6. Welcome email is sent to participant

### Database Schema

The registration form stores data in the `hackathon_registrations` table with the following fields:
- Personal information (name, email, phone)
- Experience level and motivation
- Selected tracks of interest
- Registration type (free/premium)
- Payment information (status, intent ID, amount)
- Timestamps for tracking

### Security Features

- Row Level Security (RLS) enabled on all tables
- Anonymous users can only insert registration data
- Authenticated users can only read their own data
- Admin functions require service role key
- Payment processing secured through Stripe
- Webhook signature verification for security

### Customization

- Update colors and branding in the CSS custom properties
- Modify form fields in `src/components/Registration.astro`
- Adjust tracks and prizes in their respective components
- Update contact information and social links
- Customize email templates in the welcome email function
- Add additional analytics in the analytics function

```sh
npm create astro@latest -- --template basics
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/basics)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/basics)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/basics/devcontainer.json)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

![just-the-basics](https://github.com/withastro/astro/assets/2244813/a0a5533c-a856-4198-8470-2d67b1d7c554)

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
