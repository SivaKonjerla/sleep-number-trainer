import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sleep Number Sales Trainer',
  description: 'Practice Step 1: Connect & Discover with AI-powered customer simulations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
