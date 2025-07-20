module.exports = {
  plugins: {
    tailwindcss: {
      config: {
        content: [
          "./index.html",
          "./src/**/*.{js,jsx,ts,tsx}",
        ],
        theme: {
          extend: {
            fontFamily: {
              sans: ['Inter', 'sans-serif'],
            },
          },
        },
        plugins: [],
      }
    },
    autoprefixer: {},
  },
};