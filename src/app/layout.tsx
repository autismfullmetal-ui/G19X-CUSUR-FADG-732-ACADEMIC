import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plataforma PDP",
  description: "Plataforma de Planes de Desarrollo Profesional",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className="h-full antialiased"
    >
      <head>
        <Script
          id="perf-measure-fix"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && window.performance && window.performance.measure) {
                var _origMeasure = window.performance.measure.bind(window.performance);
                window.performance.measure = function(name, start, end) {
                  try {
                    return _origMeasure.apply(window.performance, arguments);
                  } catch (e) {
                    if (e && e.message && (e.message.indexOf('negative') !== -1 || e.message.indexOf('time stamp') !== -1)) {
                      return;
                    }
                    throw e;
                  }
                };
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
