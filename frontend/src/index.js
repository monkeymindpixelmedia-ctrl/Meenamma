import React from "react";
import ReactDOM from "react-dom/client";
import { SuperTokensWrapper } from "supertokens-auth-react";
import "./index.css";
import "./lib/supertokens";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <SuperTokensWrapper>
    <App />
  </SuperTokensWrapper>
);
