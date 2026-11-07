import React, { type PropsWithChildren } from "react";
import { ScrollViewStyleReset } from "expo-router/html";

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
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
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
body,
#root {
  height: 100%;
  min-height: 100%;
  min-height: -webkit-fill-available;
  background-color: #ffffff;
}
`;
