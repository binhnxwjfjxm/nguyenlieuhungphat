export type ClerkAppearance = Record<string, unknown>;

const sharedElements = {
  rootBox: {
    width: "100%",
  },
  cardBox: {
    width: "100%",
    boxShadow: "none",
  },
  card: {
    width: "100%",
    padding: "0",
    border: "0",
    background: "transparent",
    boxShadow: "none",
  },
  header: {
    display: "none",
  },
  headerTitle: {
    display: "none",
  },
  headerSubtitle: {
    display: "none",
  },
  socialButtonsBlockButton: {
    minHeight: "50px",
    border: "1px solid #dadce0",
    borderRadius: "13px",
    background: "#ffffff",
    color: "#202124",
    boxShadow: "0 1px 2px rgba(60, 64, 67, .16)",
    fontWeight: "650",
  },
  socialButtonsBlockButtonText: {
    color: "#202124",
    fontWeight: "650",
  },
  dividerLine: {
    background: "#e5e9e4",
  },
  dividerText: {
    color: "#6c757d",
    fontSize: ".74rem",
  },
  formFieldLabel: {
    color: "#17221a",
    fontSize: ".78rem",
    fontWeight: "720",
  },
  formFieldInput: {
    minHeight: "50px",
    border: "1px solid #e5e9e4",
    borderRadius: "13px",
    background: "#ffffff",
    color: "#17221a",
    boxShadow: "none",
  },
  formButtonPrimary: {
    minHeight: "50px",
    borderRadius: "13px",
    background: "#198754",
    boxShadow: "0 10px 20px rgba(25, 135, 84, .18)",
    fontWeight: "780",
  },
  footer: {
    background: "transparent",
  },
  footerActionLink: {
    color: "#198754",
    fontWeight: "760",
  },
  identityPreviewEditButton: {
    color: "#198754",
  },
  formResendCodeLink: {
    color: "#198754",
  },
} as const;

export const customerSignInAppearance: ClerkAppearance = {
  variables: {
    colorPrimary: "#198754",
    colorForeground: "#17221a",
    colorMutedForeground: "#6c757d",
    colorInputBackground: "#ffffff",
    colorInputForeground: "#17221a",
    borderRadius: "13px",
    fontFamily:
      'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  elements: sharedElements,
};

export const customerUserProfileAppearance: ClerkAppearance = {
  variables: {
    colorPrimary: "#198754",
    colorForeground: "#17221a",
    colorMutedForeground: "#6c757d",
    colorInputBackground: "#ffffff",
    colorInputForeground: "#17221a",
    borderRadius: "14px",
    fontFamily:
      'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  elements: {
    rootBox: {
      width: "100%",
    },
    cardBox: {
      width: "100%",
      boxShadow: "none",
    },
    card: {
      width: "100%",
      border: "0",
      background: "transparent",
      boxShadow: "none",
    },
    navbar: {
      borderRight: "1px solid #e5e9e4",
    },
    navbarButton: {
      color: "#6c757d",
    },
    navbarButtonActive: {
      color: "#0f6b3d",
      background: "#ebf5e9",
    },
    pageScrollBox: {
      padding: "0",
    },
    profileSection: {
      borderBottom: "1px solid #e5e9e4",
    },
    profileSectionPrimaryButton: {
      color: "#198754",
    },
    formButtonPrimary: sharedElements.formButtonPrimary,
    formFieldInput: sharedElements.formFieldInput,
    formFieldLabel: sharedElements.formFieldLabel,
  },
};
