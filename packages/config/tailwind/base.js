/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "var(--brand-primary)",
          accent: "var(--brand-accent)",
        },
        surface: {
          base: "var(--surface-base)",
          card: "var(--surface-card)",
        },
        border: {
          DEFAULT: "var(--border-default)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
        },
        type: {
          income: "var(--type-income)",
          expense: "var(--type-expense)",
          saving: "var(--type-saving)",
          "debt-given": "var(--type-debt-given)",
          "debt-received": "var(--type-debt-received)",
        },
      },
    },
  },
};
