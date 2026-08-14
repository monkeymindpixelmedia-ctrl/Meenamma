import SuperTokens from "supertokens-auth-react";
import EmailPassword from "supertokens-auth-react/recipe/emailpassword";
import EmailVerification from "supertokens-auth-react/recipe/emailverification";
import Session from "supertokens-auth-react/recipe/session";
import ThirdParty, { Google } from "supertokens-auth-react/recipe/thirdparty";

const browserOrigin = window.location.origin;

SuperTokens.init({
  appInfo: {
    appName: process.env.REACT_APP_SUPERTOKENS_APP_NAME || "Meenamma",
    apiDomain: process.env.REACT_APP_SUPERTOKENS_API_DOMAIN || browserOrigin,
    websiteDomain: process.env.REACT_APP_SUPERTOKENS_WEBSITE_DOMAIN || browserOrigin,
    apiBasePath: "/api/auth",
    websiteBasePath: "/auth",
  },
  recipeList: [
    EmailPassword.init(),
    ThirdParty.init({ signInAndUpFeature: { providers: [Google.init()] } }),
    EmailVerification.init(),
    Session.init(),
  ],
});
