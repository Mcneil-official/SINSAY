import { Redirect } from "expo-router";
import React from "react";

export default function ForgotPasswordRedirect() {
  return (
    <Redirect
      href={{ pathname: "/loginpage", params: { reset: "1" } }}
    />
  );
}
