# Aura News: AI-Native Business Intelligence

Aura News is a next-generation business news platform that leverages advanced artificial intelligence to deliver highly personalized, interactive, and actionable business intelligence.

## 🚀 Features

- **Personalized Newsrooms**: Tailored news feeds that adapt to your specific business interests and industry focus.
- **Interactive Briefings**: Dynamic summaries and deep-dives allowing you to ask questions and interact with the news.
- **AI-Powered Insights**: Powered by Google's Gemini (`@google/genai`) to synthesize complex business data.
- **Story Arc Tracking**: Follow the continuous evolution of ongoing business stories and trends over time.
- **Vernacular Support**: Access critical business intelligence in multiple languages.
- **Real-Time Data Visualization**: Interactive charts and graphs powered by Recharts.
- **Modern UI/UX**: Built with React, TailwindCSS, and fluid animations for a premium user experience.

## 🛠 Tech Stack

- **Frontend Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [TailwindCSS 4](https://tailwindcss.com/)
- **Backend & Database**: [Firebase](https://firebase.google.com/)
- **AI / LLM Integration**: Google GenAI (`@google/genai`)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: Motion
- **Data Visualization**: Recharts

## 📦 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone this repository (if applicable) or navigate to the project directory:
   ```bash
   cd aura_news
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```
   *(or `yarn install` / `pnpm install` depending on your package manager)*

3. Set up environment variables:
   Copy `.env.example` to `.env` and configure your necessary API keys (such as your Google Gemini API Key and Firebase configuration files).
   ```bash
   cp .env.example .env
   ```

### Running the App

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000` (or `http://0.0.0.0:3000` as configured).

### Building for Production

To create an optimized production build:

```bash
npm run build
```

To preview the built production application:

```bash
npm run preview
```

## 📜 Available Scripts

- `npm run dev` - Starts the Vite development server.
- `npm run build` - Builds the application for production.
- `npm run preview` - Previews the production build locally.
- `npm run lint` - Runs TypeScript compiler checks (`tsc --noEmit`).
- `npm run clean` - Removes the `dist` directory.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for bug fixes, new features, or improvements.
