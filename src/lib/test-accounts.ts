export function isTestAccount(email: string, name = "") {
  return email.endsWith("@example.test") || /\be2e\b/i.test(name);
}

export function allowTestAccounts() {
  return Boolean(process.env.TEST_DB_PATH);
}
