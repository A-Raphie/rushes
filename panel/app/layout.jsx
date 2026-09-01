import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";
import "./globals.css";

export const metadata = {
  title: "Rushes · the tape of what your agent actually did",
  description:
    "Point Rushes at a task. It runs on Solari and you get the receipt: an auto-cut clip, a serial-numbered manifest, and a replay hosted on Solari's own servers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
