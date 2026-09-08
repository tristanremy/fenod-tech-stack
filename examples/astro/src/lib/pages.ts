export const pages = {
  home: {
    path: "/",
    title: "Astro reference",
    description: "A small static reference for metadata, structured data and native images.",
  },
  content: {
    path: "/content/",
    title: "Content </title> & café",
    description:
      'Safe text: </script><script>alert("fixture")</script> — l’été & "quotes", backslash \\, separators \u2028\u2029.',
  },
} as const;
