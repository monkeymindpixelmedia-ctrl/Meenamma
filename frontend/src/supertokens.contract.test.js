import fs from "fs";
import path from "path";

const mockSuperTokensInit = jest.fn();
const mockEmailPasswordInit = jest.fn(() => "email-password-recipe");
const mockGoogleInit = jest.fn(() => "google-provider");
const mockThirdPartyInit = jest.fn(() => "third-party-recipe");
const mockEmailVerificationInit = jest.fn(() => "email-verification-recipe");
const mockSessionInit = jest.fn(() => "session-recipe");
const mockRender = jest.fn();
const mockCreateRoot = jest.fn(() => ({ render: mockRender }));

function MockSuperTokensWrapper({ children }) {
  return children;
}

function MockApp() {
  return null;
}

jest.mock("supertokens-auth-react", () => ({
  __esModule: true,
  default: { init: mockSuperTokensInit },
  SuperTokensWrapper: MockSuperTokensWrapper,
}));
jest.mock("supertokens-auth-react/recipe/emailpassword", () => ({
  __esModule: true,
  default: { init: mockEmailPasswordInit },
}));
jest.mock("supertokens-auth-react/recipe/emailverification", () => ({
  __esModule: true,
  default: { init: mockEmailVerificationInit },
}));
jest.mock("supertokens-auth-react/recipe/session", () => ({
  __esModule: true,
  default: { init: mockSessionInit },
}));
jest.mock("supertokens-auth-react/recipe/thirdparty", () => ({
  __esModule: true,
  default: { init: mockThirdPartyInit },
  Google: { init: mockGoogleInit },
}));
jest.mock("react-dom/client", () => ({ createRoot: mockCreateRoot }));
jest.mock("./App", () => MockApp);

describe("SuperTokens frontend contract", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    mockEmailPasswordInit.mockReturnValue("email-password-recipe");
    mockGoogleInit.mockReturnValue("google-provider");
    mockThirdPartyInit.mockReturnValue("third-party-recipe");
    mockEmailVerificationInit.mockReturnValue("email-verification-recipe");
    mockSessionInit.mockReturnValue("session-recipe");
    mockCreateRoot.mockReturnValue({ render: mockRender });
  });

  test("initializes the exact app paths and required recipes", () => {
    jest.isolateModules(() => require("./lib/supertokens"));

    expect(mockSuperTokensInit).toHaveBeenCalledWith({
      appInfo: {
        appName: "Meenamma",
        apiDomain: process.env.REACT_APP_SUPERTOKENS_API_DOMAIN || window.location.origin,
        websiteDomain: process.env.REACT_APP_SUPERTOKENS_WEBSITE_DOMAIN || window.location.origin,
        apiBasePath: "/api/auth",
        websiteBasePath: "/auth",
      },
      recipeList: [
        "email-password-recipe",
        "third-party-recipe",
        "email-verification-recipe",
        "session-recipe",
      ],
    });
    expect(mockThirdPartyInit).toHaveBeenCalledWith({
      signInAndUpFeature: { providers: ["google-provider"] },
    });
  });

  test("renders App inside SuperTokensWrapper", () => {
    document.body.innerHTML = '<div id="root"></div>';

    jest.isolateModules(() => require("./index"));

    const renderedTree = mockRender.mock.calls[0][0];
    expect(renderedTree.type).toBe(MockSuperTokensWrapper);
    expect(renderedTree.props.children.type).toBe(MockApp);
  });

  test("declares the exact Google callback and email verification routes", () => {
    const source = fs.readFileSync(path.join(__dirname, "App.js"), "utf8");

    expect(source).toContain('path="/auth/callback/google"');
    expect(source).toContain('path="/auth/verify-email"');
  });

  test("keeps provider and login credentials out of frontend auth source", () => {
    const integrationFiles = [
      "lib/supertokens.js",
      "pages/Login.jsx",
      "pages/ThirdPartyCallback.jsx",
      "pages/VerifyEmail.jsx",
    ];
    const source = integrationFiles
      .map((file) => fs.readFileSync(path.join(__dirname, file), "utf8"))
      .join("\n");

    expect(source).not.toMatch(
      /(?:clientSecret|clientId|apiKey)\s*[:=]\s*["'][^"']+["']|fillDemo\(\s*["'][^"']+@[^"]+["']\s*,\s*["'][^"']+["']/i
    );
  });
});
