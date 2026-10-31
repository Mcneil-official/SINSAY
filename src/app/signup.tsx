import { Redirect } from "expo-router";
import React from "react";

export default function SignUpPage() {
  return (
    <Redirect
      href={{ pathname: "/loginpage", params: { mode: "signup" } }}
    />
  );
}
