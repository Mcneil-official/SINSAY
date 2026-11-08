import { ScrollViewStyleReset } from "expo-router/html";
import React, { type PropsWithChildren } from "react";

/**
 * This file is web-only and used to configure the root HTML for every
 * web page during static export and development.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=auto"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
html,
body {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  overscroll-behavior: none;
  background-color: #F8FAFC;
  -webkit-text-size-adjust: 100%;
  -webkit-tap-highlight-color: transparent;
}

#root {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: auto !important;
  min-height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  overscroll-behavior: none !important;
  background-color: #F8FAFC;
}
`;
