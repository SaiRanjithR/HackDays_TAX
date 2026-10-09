export const metadata = {
  title: 'AI Tax Copilot — FY 2025-26',
  description: 'Deterministic Tax Engine, Tax Twin & AI Copilot for Indian Taxpayers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          margin: 0,
          padding: 0,
          background: '#0a0f1d',
          color: '#f8fafc',
          minHeight: '100vh',
          boxSizing: 'border-box',
        }}
      >
        {children}
      </body>
    </html>
  );
}
