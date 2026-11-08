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
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
html {
  background-color: #F8FAFC;
  height: 100vh;
  height: 100dvh;
  margin: 0;
  padding: 0;
}

body {
  background-color: #F8FAFC;
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
#root {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  width: 100%;
  overflow: hidden;
  background-color: #F8FAFC;
}
`;
